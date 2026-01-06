import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await api.register({ email, password });
            alert('註冊成功！請登入');
            navigate('/login');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="auth-form card">
            <h2 className="text-center mb-4">註冊</h2>
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
                <button className="btn" style={{ width: '100%' }} type="submit">註冊</button>
            </form>
            <p className="text-center" style={{ marginTop: '15px' }}>
                已有帳號？ <Link to="/login">登入</Link>
            </p>
        </div>
    );
};

export default Register;
