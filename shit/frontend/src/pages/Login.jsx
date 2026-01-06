import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const data = await api.login({ email, password });
            localStorage.setItem('token', data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="auth-form card">
            <h2 className="text-center mb-4">登入</h2>
            {error && <div className="error text-center">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="input-group">
                    <label>密碼</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button className="btn" style={{ width: '100%' }} type="submit">登入</button>
            </form>
            <p className="text-center" style={{ marginTop: '15px' }}>
                還沒有帳號？ <Link to="/register">註冊</Link>
            </p>
        </div>
    );
};

export default Login;
