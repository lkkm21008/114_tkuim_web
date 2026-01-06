import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newCat, setNewCat] = useState({ name: '', type: 'expense' });
    const navigate = useNavigate();

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const data = await api.getCategories();
            setCategories(data);
        } catch (err) {
            setError(err.message);
            if (err.message.includes('Unauthorized')) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!newCat.name) return;
            await api.createCategory(newCat);
            setNewCat({ name: '', type: 'expense' });
            fetchCategories();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('確定要刪除嗎？')) return;
        try {
            await api.deleteCategory(id);
            fetchCategories();
        } catch (err) {
            alert(err.message);
        }
    };

    const expenseCats = categories.filter(c => c.type === 'expense');
    const incomeCats = categories.filter(c => c.type === 'income');

    return (
        <div className="container">
            <div className="flex justify-between items-center mb-4">
                <h1>分類管理</h1>
                <Link to="/dashboard" className="btn">返回記帳</Link>
            </div>

            {error && <div className="card error">{error}</div>}

            <div className="card mb-4">
                <h3>新增分類</h3>
                <form onSubmit={handleSubmit} className="flex items-center">
                    <input
                        type="text"
                        placeholder="分類名稱 (如: 早餐)"
                        value={newCat.name}
                        onChange={e => setNewCat({ ...newCat, name: e.target.value })}
                        required
                        style={{ flex: 2, marginRight: '10px' }}
                    />
                    <select
                        value={newCat.type}
                        onChange={e => setNewCat({ ...newCat, type: e.target.value })}
                        style={{ flex: 1, marginRight: '10px', padding: '9px' }}
                    >
                        <option value="expense">支出</option>
                        <option value="income">收入</option>
                    </select>
                    <button type="submit" className="btn">新增</button>
                </form>
            </div>

            <div className="flex" style={{ gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{ color: 'red' }}>支出分類</h3>
                    {expenseCats.map(c => (
                        <div key={c._id} className="card flex justify-between items-center" style={{ padding: '10px', marginBottom: '10px' }}>
                            <span>{c.name}</span>
                            <button className="btn btn-danger" style={{ padding: '5px 10px' }} onClick={() => handleDelete(c._id)}>刪除</button>
                        </div>
                    ))}
                    {expenseCats.length === 0 && <p>無</p>}
                </div>

                <div style={{ flex: 1 }}>
                    <h3 style={{ color: 'green' }}>收入分類</h3>
                    {incomeCats.map(c => (
                        <div key={c._id} className="card flex justify-between items-center" style={{ padding: '10px', marginBottom: '10px' }}>
                            <span>{c.name}</span>
                            <button className="btn btn-danger" style={{ padding: '5px 10px' }} onClick={() => handleDelete(c._id)}>刪除</button>
                        </div>
                    ))}
                    {incomeCats.length === 0 && <p>無</p>}
                </div>
            </div>
        </div>
    );
};

export default Categories;
