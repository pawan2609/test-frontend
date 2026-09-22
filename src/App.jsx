import { useState, useCallback, useMemo } from 'react';
import { ConfigProvider, theme, Tag } from 'antd';
import { ApiOutlined, DisconnectOutlined } from '@ant-design/icons';
import useWebSocket from './hooks/useWebSocket';
import OrderBookPanel from './components/OrderBookPanel';
import PricingDashboard from './components/PricingDashboard';
import TradingPanel from './components/TradingPanel';
import PortfolioPanel from './components/PortfolioPanel';

export default function App() {
  const [books, setBooks] = useState({});
  const [pricing, setPricing] = useState({});
  const [openOrders, setOpenOrders] = useState([]);
  const [fills, setFills] = useState([]);
  const [portfolio, setPortfolio] = useState(null);

  const refreshPortfolio = useCallback(async () => {
    try {
      const res = await fetch('/api/portfolio');
      if (res.ok) setPortfolio(await res.json());
    } catch { /* ignore */ }
  }, []);

  const refreshOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOpenOrders(data.open || []);
      }
    } catch { /* ignore */ }
  }, []);

  const refreshFills = useCallback(async () => {
    try {
      const res = await fetch('/api/fills');
      if (res.ok) setFills(await res.json());
    } catch { /* ignore */ }
  }, []);

  const handlers = useMemo(() => ({
    hello: () => {
      refreshPortfolio();
      refreshOrders();
      refreshFills();
    },
    book: (msg) => {
      setBooks((prev) => ({ ...prev, [msg.exchange]: msg }));
    },
    pricing: (msg) => {
      setPricing(msg);
    },
    fill: (msg) => {
      if (msg.fill) {
        setFills((prev) => [...prev, msg.fill]);
      }
      refreshPortfolio();
      refreshOrders();
    },
    order_update: () => {
      refreshOrders();
      refreshPortfolio();
    },
  }), [refreshPortfolio, refreshOrders, refreshFills]);

  const { connected } = useWebSocket(handlers);

  const handlePlaceOrder = useCallback(async (orderData) => {
    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Order failed');
    refreshPortfolio();
    refreshOrders();
    refreshFills();
    return data;
  }, [refreshPortfolio, refreshOrders, refreshFills]);

  const handleCancelOrder = useCallback(async (orderId) => {
    const res = await fetch(`/api/order/${orderId}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Cancel failed');
    }
    refreshOrders();
    refreshPortfolio();
  }, [refreshOrders, refreshPortfolio]);

  const midPrices = useMemo(() => {
    const mids = {};
    const binMid = pricing?.binance?.mid_price;
    const cdxMid = pricing?.coindcx?.mid_price;
    if (binMid) mids['BTCUSDT'] = parseFloat(binMid);
    else if (cdxMid) mids['BTCUSDT'] = parseFloat(cdxMid);
    return mids;
  }, [pricing]);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#6366f1',
          borderRadius: 8,
          fontFamily: "'Inter', -apple-system, sans-serif",
          colorBgContainer: 'rgba(17, 24, 39, 0.8)',
          colorBgElevated: '#1e293b',
          colorBorder: 'rgba(255, 255, 255, 0.06)',
        },
      }}
    >
      <div className="app-layout">
        <div className="app-header">
          <h1>DhanTrive Capital</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Tag
              color={connected ? 'green' : 'red'}
              icon={connected ? <ApiOutlined /> : <DisconnectOutlined />}
              style={{ margin: 0 }}
            >
              {connected ? 'CONNECTED' : 'DISCONNECTED'}
            </Tag>
          </div>
        </div>

        <div className="app-content">
          <div className="col-left">
            <OrderBookPanel books={books} />
          </div>

          <div className="col-center">
            <PricingDashboard pricing={pricing} />
            <PortfolioPanel portfolio={portfolio} midPrices={midPrices} />
          </div>

          <div className="col-right">
            <TradingPanel
              openOrders={openOrders}
              fills={fills}
              onPlaceOrder={handlePlaceOrder}
              onCancelOrder={handleCancelOrder}
            />
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
