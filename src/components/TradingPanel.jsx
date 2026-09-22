import { useState } from 'react';
import { Card, Form, Radio, InputNumber, Button, Table, Tag, Space, message, Select } from 'antd';
import { ShoppingCartOutlined, CloseCircleOutlined } from '@ant-design/icons';

function fmtTime(ts) {
  if (!ts) return '-';
  return new Date(ts).toLocaleTimeString();
}

function fmtNum(v) {
  if (v == null || v === '') return '-';
  const n = parseFloat(v);
  if (isNaN(n)) return v;
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 });
}

const STATUS_COLORS = {
  open: 'blue',
  partially_filled: 'orange',
  filled: 'green',
  cancelled: 'default',
};

export default function TradingPanel({ openOrders, fills, onPlaceOrder, onCancelOrder }) {
  const [form] = Form.useForm();
  const [side, setSide] = useState('buy');
  const [orderType, setOrderType] = useState('market');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await onPlaceOrder({
        side,
        type: orderType,
        quantity: String(values.quantity),
        price: orderType === 'limit' ? String(values.price) : undefined,
      });
      message.success(`${side.toUpperCase()} order placed`);
    } catch (err) {
      message.error(err.message || 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  const orderColumns = [
    {
      title: 'Side',
      dataIndex: 'side',
      key: 'side',
      width: 50,
      render: (v) => (
        <Tag color={v === 'buy' ? 'green' : 'red'} style={{ margin: 0 }}>
          {v?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'order_type',
      key: 'order_type',
      width: 55,
      render: (v) => <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v?.toUpperCase()}</span>,
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 70,
      render: fmtNum,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 80,
      render: (v) => v ? fmtNum(v) : <span style={{ color: 'var(--text-muted)' }}>MKT</span>,
    },
    {
      title: 'Filled',
      dataIndex: 'filled_qty',
      key: 'filled_qty',
      width: 70,
      render: fmtNum,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 65,
      render: (v) => <Tag color={STATUS_COLORS[v] || 'default'} style={{ margin: 0, fontSize: 10 }}>{v?.toUpperCase()}</Tag>,
    },
    {
      title: '',
      key: 'action',
      width: 32,
      render: (_, record) =>
        record.status === 'open' || record.status === 'partially_filled' ? (
          <Button
            type="text"
            danger
            size="small"
            icon={<CloseCircleOutlined />}
            onClick={() => onCancelOrder(record.id)}
          />
        ) : null,
    },
  ];

  const fillColumns = [
    {
      title: 'Time',
      dataIndex: 'ts_ms',
      key: 'ts_ms',
      width: 80,
      render: fmtTime,
    },
    {
      title: 'Side',
      dataIndex: 'side',
      key: 'side',
      width: 50,
      render: (v) => (
        <Tag color={v === 'buy' ? 'green' : 'red'} style={{ margin: 0, fontSize: 10 }}>
          {v?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 90,
      render: fmtNum,
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 70,
      render: fmtNum,
    },
    {
      title: 'Exchange',
      dataIndex: 'exchange',
      key: 'exchange',
      width: 70,
      render: (v) => <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{v?.toUpperCase()}</span>,
    },
  ];

  return (
    <>

      <Card title="PLACE ORDER" size="small">
        <Form form={form} onFinish={handleSubmit} layout="vertical" size="small">
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <Button
              block
              className={side === 'buy' ? 'btn-buy' : ''}
              type={side === 'buy' ? 'primary' : 'default'}
              onClick={() => setSide('buy')}
              style={{ flex: 1 }}
            >
              BUY
            </Button>
            <Button
              block
              className={side === 'sell' ? 'btn-sell' : ''}
              type={side === 'sell' ? 'primary' : 'default'}
              onClick={() => setSide('sell')}
              style={{ flex: 1 }}
            >
              SELL
            </Button>
          </div>

          <Form.Item label="Order Type" style={{ marginBottom: 8 }}>
            <Radio.Group
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              buttonStyle="solid"
              size="small"
              style={{ width: '100%' }}
            >
              <Radio.Button value="market" style={{ width: '50%', textAlign: 'center' }}>Market</Radio.Button>
              <Radio.Button value="limit" style={{ width: '50%', textAlign: 'center' }}>Limit</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: 'Enter quantity' }]}
            style={{ marginBottom: 8 }}
          >
            <InputNumber
              min={0.00001}
              step={0.001}
              placeholder="0.00"
              style={{ width: '100%' }}
              stringMode
            />
          </Form.Item>

          {orderType === 'limit' && (
            <Form.Item
              name="price"
              label="Limit Price"
              rules={[{ required: true, message: 'Enter limit price' }]}
              style={{ marginBottom: 8 }}
            >
              <InputNumber
                min={0.01}
                step={0.01}
                placeholder="0.00"
                style={{ width: '100%' }}
                stringMode
              />
            </Form.Item>
          )}

          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            className={side === 'buy' ? 'btn-buy' : 'btn-sell'}
            icon={<ShoppingCartOutlined />}
          >
            {side === 'buy' ? 'BUY' : 'SELL'} {orderType === 'limit' ? 'LIMIT' : 'MARKET'}
          </Button>
        </Form>
      </Card>


      <Card title={`OPEN ORDERS (${(openOrders || []).length})`} size="small" style={{ flex: 1 }}>
        <div style={{ maxHeight: 160, overflow: 'auto' }}>
          <Table
            columns={orderColumns}
            dataSource={(openOrders || []).map((o) => ({ ...o, key: o.id }))}
            pagination={false}
            size="small"
            locale={{ emptyText: <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>No open orders</span> }}
          />
        </div>
      </Card>


      <Card title={`FILLS (${(fills || []).length})`} size="small" style={{ flex: 1 }}>
        <div style={{ maxHeight: 160, overflow: 'auto' }}>
          <Table
            columns={fillColumns}
            dataSource={(fills || []).slice().reverse().map((f) => ({ ...f, key: f.id }))}
            pagination={false}
            size="small"
            locale={{ emptyText: <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>No fills yet</span> }}
          />
        </div>
      </Card>
    </>
  );
}
