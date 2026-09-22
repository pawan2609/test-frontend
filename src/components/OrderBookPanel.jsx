import { Card, Table, Tag, Badge } from 'antd';
import { useMemo } from 'react';

const STATUS_MAP = {
  live: { color: 'green', text: 'LIVE' },
  stale: { color: 'orange', text: 'STALE' },
  syncing: { color: 'blue', text: 'SYNCING' },
  connecting: { color: 'default', text: 'CONNECTING' },
  reconnecting: { color: 'red', text: 'RECONNECTING' },
};

function formatNum(s) {
  if (!s) return '-';
  const n = parseFloat(s);
  if (isNaN(n)) return s;
  if (n >= 1000) return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(4);
  return n.toFixed(8);
}

function BookSide({ data, side, maxQty }) {
  const columns = side === 'bid'
    ? [
        {
          title: 'Qty',
          dataIndex: 'qty',
          key: 'qty',
          align: 'right',
          width: '50%',
          render: (v) => <span style={{ color: 'var(--text-secondary)' }}>{formatNum(v)}</span>,
        },
        {
          title: 'Price',
          dataIndex: 'price',
          key: 'price',
          align: 'right',
          width: '50%',
          render: (v) => <span className="price-green">{formatNum(v)}</span>,
        },
      ]
    : [
        {
          title: 'Price',
          dataIndex: 'price',
          key: 'price',
          align: 'left',
          width: '50%',
          render: (v) => <span className="price-red">{formatNum(v)}</span>,
        },
        {
          title: 'Qty',
          dataIndex: 'qty',
          key: 'qty',
          align: 'left',
          width: '50%',
          render: (v) => <span style={{ color: 'var(--text-secondary)' }}>{formatNum(v)}</span>,
        },
      ];

  const rows = useMemo(() =>
    (data || []).map(([price, qty], i) => ({
      key: `${side}-${i}`,
      price,
      qty,
      pctOfMax: maxQty > 0 ? (parseFloat(qty) / maxQty) * 100 : 0,
    })),
    [data, side, maxQty]
  );

  return (
    <Table
      columns={columns}
      dataSource={rows}
      pagination={false}
      size="small"
      showHeader={true}
      rowClassName="depth-row"
      onRow={(record) => ({
        style: {
          background: side === 'bid'
            ? `linear-gradient(to left, var(--green-dim) ${record.pctOfMax}%, transparent ${record.pctOfMax}%)`
            : `linear-gradient(to right, var(--red-dim) ${record.pctOfMax}%, transparent ${record.pctOfMax}%)`,
        },
      })}
    />
  );
}

export default function OrderBookPanel({ books }) {
  const exchanges = ['binance', 'coindcx'];

  return (
    <>
      {exchanges.map((ex) => {
        const book = books[ex];
        if (!book) return null;

        const st = STATUS_MAP[book.status] || STATUS_MAP.connecting;
        const allQtys = [...(book.bids || []), ...(book.asks || [])].map(([, q]) => parseFloat(q));
        const maxQty = allQtys.length > 0 ? Math.max(...allQtys) : 1;

        return (
          <Card
            key={ex}
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{ex.toUpperCase()}</span>
                <Tag color={st.color} style={{ margin: 0, fontSize: 10 }}>{st.text}</Tag>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
                  {book.symbol || ''}
                </span>
              </div>
            }
            size="small"
            style={{ flex: 1, overflow: 'hidden' }}
            bodyStyle={{ padding: '0 !important', display: 'flex', gap: 0 }}
          >
            <div className="book-sides">
              <div style={{ flex: 1, overflow: 'auto', maxHeight: 280 }}>
                <BookSide data={book.bids} side="bid" maxQty={maxQty} />
              </div>
              <div className="book-sides-divider" />
              <div style={{ flex: 1, overflow: 'auto', maxHeight: 280 }}>
                <BookSide data={book.asks} side="ask" maxQty={maxQty} />
              </div>
            </div>
          </Card>
        );
      })}
    </>
  );
}
