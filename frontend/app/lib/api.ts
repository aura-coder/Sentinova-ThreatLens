const API = 'http://localhost:5000/api';

export const fetchIndicators = () => fetch(`${API}/indicators`).then(r => r.json());
export const fetchStats = () => fetch(`${API}/stats`).then(r => r.json());
export const fetchFeeds = () => fetch(`${API}/feeds`).then(r => r.json());
