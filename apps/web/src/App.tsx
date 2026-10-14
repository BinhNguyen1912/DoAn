export default function App() {
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>
          Safe Zone Monitor
        </h1>
        <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
          Hệ thống giám sát vùng nguy hiểm bằng Edge AI & Cảnh báo giọng nói
        </p>
      </header>
      <section style={{ padding: '1.5rem', background: '#1e293b', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '1.25rem', marginTop: 0 }}>Trạng thái hệ thống</h2>
        <p style={{ color: '#cbd5e1' }}>Khởi tạo thành công. Đang chờ kết nối Backend & Edge AI.</p>
      </section>
    </main>
  )
}
