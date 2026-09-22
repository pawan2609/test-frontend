import { Card, Statistic, Table, Row, Col } from 'antd';
import { WalletOutlined, LineChartOutlined } from '@ant-design/icons';

function fmtNum(v) {
  if (v == null || v === '') return '-';
  const n = parseFloat(v);
  if (isNaN(n)) return v;
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

function fmtUsd(v) {
  if (v == null || v === '') return '-';
  const n = parseFloat(v);
  if (isNaN(n)) return v;
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PortfolioPanel({ portfolio, midPrices }) {
  const cash = parseFloat(portfolio?.cash || '0');
  const totalPnl = parseFloat(portfolio?.total_realized_pnl || '0');


  let unrealizedPnl = 0;
  const positions = (portfolio?.positions || []).map((p) => {
    const qty = parseFloat(p.quantity);
    const avgCost = parseFloat(p.avg_cost);
    const mid = midPrices?.[p.symbol] || avgCost;
    const unrealized = (mid - avgCost) * qty;
    unrealizedPnl += unrealized;
    return {
      ...p,
      key: p.symbol,
      currentPrice: mid,
      unrealized,
    };
  });

  const positionValue = positions.reduce((sum, p) => sum + parseFloat(p.quantity) * p.currentPrice, 0);
  const totalEquity = cash + positionValue;

  const posColumns = [
    {
      title: 'Symbol',
      dataIndex: 'symbol',
      key: 'symbol',
      render: (v) => <span style={{ fontWeight: 600, fontSize: 11 }}>{v}</span>,
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
      render: fmtNum,
    },
    {
      title: 'Avg Cost',
      dataIndex: 'avg_cost',
      key: 'avg_cost',
      align: 'right',
      render: fmtNum,
    },
    {
      title: 'Mid',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      align: 'right',
      render: (v) => fmtNum(String(v)),
    },
    {
      title: 'Unrl. PnL',
      dataIndex: 'unrealized',
      key: 'unrealized',
      align: 'right',
      render: (v) => (
        <span style={{ color: v >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
          {v >= 0 ? '+' : ''}{fmtUsd(String(v))}
        </span>
      ),
    },
    {
      title: 'Real. PnL',
      dataIndex: 'realized_pnl',
      key: 'realized_pnl',
      align: 'right',
      render: (v) => {
        const n = parseFloat(v);
        return (
          <span style={{ color: n >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>
            {n >= 0 ? '+' : ''}{fmtUsd(v)}
          </span>
        );
      },
    },
  ];

  return (
    <Card title="PORTFOLIO" size="small">
      <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
        <Col span={12}>
          <Statistic
            title="Cash"
            value={fmtUsd(String(cash))}
            prefix={<WalletOutlined />}
            valueStyle={{ fontSize: 16, color: 'var(--text-primary)' }}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Total Equity"
            value={fmtUsd(String(totalEquity))}
            prefix={<LineChartOutlined />}
            valueStyle={{ fontSize: 16, color: 'var(--accent)' }}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Realized PnL"
            value={`${totalPnl >= 0 ? '+' : ''}${fmtUsd(String(totalPnl))}`}
            valueStyle={{
              fontSize: 14,
              color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)',
            }}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Unrealized PnL"
            value={`${unrealizedPnl >= 0 ? '+' : ''}${fmtUsd(String(unrealizedPnl))}`}
            valueStyle={{
              fontSize: 14,
              color: unrealizedPnl >= 0 ? 'var(--green)' : 'var(--red)',
            }}
          />
        </Col>
      </Row>

      {positions.length > 0 && (
        <Table
          columns={posColumns}
          dataSource={positions}
          pagination={false}
          size="small"
        />
      )}
    </Card>
  );
}
