import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

/**
 * Debug Route - Trang kiểm tra routing và thông tin môi trường
 * Truy cập: /debug-route
 */
export default function DebugRoute() {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const [windowInfo, setWindowInfo] = useState<any>({});

  useEffect(() => {
    setWindowInfo({
      href: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      origin: window.location.origin,
      hostname: window.location.hostname,
      protocol: window.location.protocol,
    });
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔍 Debug Route Information</h1>
        
        <div className="space-y-6">
          {/* React Router Info */}
          <div className="bg-card border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-3">React Router Info</h2>
            <div className="space-y-2 font-mono text-sm">
              <p><strong>location.pathname:</strong> {location.pathname}</p>
              <p><strong>location.search:</strong> {location.search || '(empty)'}</p>
              <p><strong>location.hash:</strong> {location.hash || '(empty)'}</p>
              <p><strong>location.state:</strong> {JSON.stringify(location.state || null)}</p>
              <p><strong>params:</strong> {JSON.stringify(params)}</p>
            </div>
          </div>

          {/* Window Location Info */}
          <div className="bg-card border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-3">Window Location Info</h2>
            <div className="space-y-2 font-mono text-sm">
              {Object.entries(windowInfo).map(([key, value]) => (
                <p key={key}>
                  <strong>{key}:</strong> {String(value)}
                </p>
              ))}
            </div>
          </div>

          {/* Environment Info */}
          <div className="bg-card border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-3">Environment Info</h2>
            <div className="space-y-2 font-mono text-sm">
              <p><strong>NODE_ENV:</strong> {import.meta.env.MODE}</p>
              <p><strong>VITE_API_URL:</strong> {import.meta.env.VITE_API_URL || '(not set)'}</p>
              <p><strong>User Agent:</strong> {navigator.userAgent}</p>
            </div>
          </div>

          {/* Test Links */}
          <div className="bg-card border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-3">Test Navigation</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-primary text-primary-foreground rounded"
              >
                Go to Home
              </button>
              <button
                onClick={() => navigate('/admin')}
                className="px-4 py-2 bg-primary text-primary-foreground rounded"
              >
                Go to /admin
              </button>
              <button
                onClick={() => window.location.href = '/admin'}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded"
              >
                Hard Reload /admin
              </button>
              <button
                onClick={() => fetch('/admin').then(r => {
                  alert(`Status: ${r.status}\nContent-Type: ${r.headers.get('content-type')}`);
                })}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded"
              >
                Test /admin Fetch
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-muted border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-3">📋 Debug Instructions</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Mở DevTools (F12) → Tab <strong>Network</strong></li>
              <li>Click button "Test /admin Fetch" ở trên</li>
              <li>Kiểm tra response:
                <ul className="list-disc list-inside ml-6 mt-1">
                  <li>Status 200 + Content-Type: text/html → Server rewrite OK ✅</li>
                  <li>Status 404 → Server chưa có rewrite rule ❌</li>
                </ul>
              </li>
              <li>Kiểm tra Console tab xem có lỗi JavaScript không</li>
              <li>Kiểm tra React Router có match route không</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

