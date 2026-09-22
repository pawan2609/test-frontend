import { Card, Statistic, Row, Col, Tag } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, SwapOutlined } from '@ant-design/icons';

function fmt(v, decimals = 2) {
  if (v == null || v === '') return '-';
  const n = parseFloat(v);
  if (isNaN(n)) return v;
  return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtBps(v) {
  if (v == null || v === '') return '-';
  return `${parseFloat(v).toFixed(2)} bps`;
}

function PriceStat({ title, value, prefix, color, decimals }) {
  return (
    <Statistic
      title={title}
      value={fmt(value, decimals || 2)}
      prefix={prefix}
      valueStyle={{
        color: color || 'var(--text-primary)',
        fontSize: 16,
        fontWeight: 600,
      }}
    />
  );
}

export default function PricingDashboard({ pricing }) {
  const binance = pricing?.binance;
  const coindcx = pricing?.coindcx;


  let delta = null;
  let deltaColor = 'var(--text-muted)';
  if (binance?.mid_price && coindcx?.mid_price) {
    const d = parseFloat(binance.mid_price) - parseFloat(coindcx.mid_price);
    delta = d.toFixed(2);
    deltaColor = d > 0 ? 'var(--green)' : d < 0 ? 'var(--red)' : 'var(--text-muted)';
  }

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>PRICING ENGINE</span>
          {delta !== null && (
            <Tag
              color={parseFloat(delta) > 0 ? 'green' : parseFloat(delta) < 0 ? 'red' : 'default'}
              style={{ margin: 0, fontSize: 10, marginLeft: 'auto' }}
            >
              Δ {delta}
            </Tag>
          )}
        </div>
      }
      size="small"
    >
      <Row gutter={[12, 12]}>
        {[
          { label: 'Binance', data: binance },
          { label: 'CoinDCX', data: coindcx },
        ].map(({ label, data }) => (
          <Col span={12} key={label}>
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 8,
              padding: '10px 12px',
              border: '1px solid var(--border-color)',
            }}>
              <div style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 8,
              }}>
                {label}
              </div>
              <Row gutter={[8, 8]}>
                <Col span={24}>
                  <PriceStat title="Mid Price" value={data?.mid_price} decimals={2} />
                </Col>
                <Col span={12}>
                  <PriceStat
                    title="VWAP Ask"
                    value={data?.vwap_ask}
                    color="var(--red)"
                    prefix={<ArrowUpOutlined />}
                    decimals={2}
                  />
                </Col>
                <Col span={12}>
                  <PriceStat
                    title="VWAP Bid"
                    value={data?.vwap_bid}
                    color="var(--green)"
                    prefix={<ArrowDownOutlined />}
                    decimals={2}
                  />
                </Col>
                <Col span={12}>
                  <PriceStat title="Spread" value={data?.spread} decimals={4} color="var(--yellow)" />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Spread"
                    value={fmtBps(data?.spread_bps)}
                    valueStyle={{ color: 'var(--yellow)', fontSize: 14, fontWeight: 500 }}
                  />
                </Col>
              </Row>
            </div>
          </Col>
        ))}
      </Row>
      {delta !== null && (
        <div style={{
          marginTop: 12,
          padding: '8px 12px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 8,
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <SwapOutlined style={{ color: 'var(--accent)', fontSize: 14 }} />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Cross-exchange delta:
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: deltaColor, fontFamily: "'JetBrains Mono', monospace" }}>
            {delta > 0 ? '+' : ''}{delta}
          </span>
        </div>
      )}
    </Card>
  );
}
