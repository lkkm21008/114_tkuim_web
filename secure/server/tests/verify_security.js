
const BASE_URL = "http://localhost:3001/api";

async function request(method, path, body, token) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${path}`, options);
    const json = await res.json().catch(() => ({}));
    return { status: res.status, json };
}

async function runTests() {
    console.log("--- Starting Security Verification ---");

    // 1. Auth: Login Admin
    console.log("\n[Test 1] Login Admin...");
    const adminRes = await request("POST", "/auth/login", { email: "admin@test.com", password: "admin123" });
    if (adminRes.status !== 200 || !adminRes.json.token) throw new Error("Admin login failed");
    const adminToken = adminRes.json.token;
    console.log("✅ Admin logged in.");

    // 2. Auth: Login User
    console.log("\n[Test 2] Login User...");
    const userRes = await request("POST", "/auth/login", { email: "user@test.com", password: "user123" });
    if (userRes.status !== 200 || !userRes.json.token) throw new Error("User login failed");
    const userToken = userRes.json.token;
    const userId = userRes.json.user._id;
    console.log("✅ User logged in.");

    // 3. RBAC: User try to create event (Should Fail)
    console.log("\n[Test 3] User try to create event (Should 403)...");
    const failEventRes = await request("POST", "/events", {
        title: "Hacked Event", date: "2025-01-01", quota: 10
    }, userToken);
    if (failEventRes.status === 403) console.log("✅ User blocked from creating event (403).");
    else console.error("❌ User SHOULD NOT be able to create event. Status:", failEventRes.status);

    // 4. RBAC: Admin create event (Should Success)
    console.log("\n[Test 4] Admin create event (Should 200)...");
    const eventRes = await request("POST", "/events", {
        title: "Test Event Security", date: "2025-12-31", quota: 5
    }, adminToken);
    if (eventRes.status === 200) console.log("✅ Admin created event.");
    else console.error("❌ Admin failed to create event. Status:", eventRes.status, eventRes.json);
    const eventId = eventRes.json._id;

    // 5. Validation: Create event with invalid data (Should Fail)
    console.log("\n[Test 5] Validation: Invalid Event Data (Should 400)...");
    const invalidRes = await request("POST", "/events", {
        title: "No Quota" // Missing quota
    }, adminToken);
    if (invalidRes.status === 400) console.log("✅ Invalid input rejected (400).");
    else console.error("❌ Invalid input NOT rejected. Status:", invalidRes.status);

    // 6. Registration: User register self (Should Success)
    console.log("\n[Test 6] User register self (Should 200)...");
    const regRes = await request("POST", "/registrations", { eventId, participantId: userId }, userToken);
    if (regRes.status === 200) console.log("✅ User registered.");
    else console.error("❌ User failed to register. Status:", regRes.status, regRes.json);

    // 7. Registration: User view own (Should Success)
    console.log("\n[Test 7] User view own registrations...");
    const viewRes = await request("GET", "/registrations", null, userToken);
    if (viewRes.status === 200 && Array.isArray(viewRes.json)) console.log(`✅ User sees ${viewRes.json.length} registrations.`);
    else console.error("❌ User failed to view registrations.");

    // 8. Rate Limit: Spam login (Should 429)
    console.log("\n[Test 8] Rate Limit: Spam login 6 times...");
    let hitLimit = false;
    for (let i = 0; i < 6; i++) {
        const r = await request("POST", "/auth/login", { email: "user@test.com", password: "user123" });
        if (r.status === 429) {
            hitLimit = true;
            console.log(`✅ Rate limit hit at attempt ${i + 1} (429).`);
            break;
        }
    }
    if (!hitLimit) console.error("❌ Rate limit NOT hit after 6 attempts.");

    console.log("\n--- Verification Complete ---");
}

runTests().catch(err => console.error("Test Error:", err));
