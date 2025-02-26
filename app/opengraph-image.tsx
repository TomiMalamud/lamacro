import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'BCRA en Vivo - Visualización de Datos del Banco Central';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(to bottom, #1e3a5f, #444)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '40px',
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 'bold',
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          BCRA en Vivo
        </div>
        <div
          style={{
            fontSize: 32,
            marginBottom: 40,
            textAlign: 'center',
            maxWidth: '80%',
          }}
        >
          Visualización de variables monetarias y financieras del Banco Central de la República Argentina
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '80%',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 16,
            padding: 20,
          }}
        >
          {['Variables Monetarias', 'Variables Cambiarias', 'Inflación'].map((text) => (
            <div
              key={text}
              style={{
                fontSize: 24,
                color: 'white',
                background: 'rgba(0, 0, 0, 0.2)',
                padding: '8px 16px',
                borderRadius: 8,
              }}
            >
              {text}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
} 