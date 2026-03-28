import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const alt = 'ApplyBoost - Multiplica tus entrevistas'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      // Image HTML/CSS structure
      <div
        style={{
          fontSize: 128,
          background: '#0f172a', // slate-950 (fondo oscuro elegante)
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Branding Container */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '40px',
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '60px 80px',
          borderRadius: '40px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          {/* Logo "AB" */}
          <div style={{
            background: '#2563eb', // blue-600
            width: '160px',
            height: '160px',
            borderRadius: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '80px',
            fontWeight: 900,
            color: 'white',
            boxShadow: '0 20px 50px rgba(37, 99, 235, 0.3)',
          }}>
            AB
          </div>
          
          {/* Text Branding */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ 
              color: 'white', 
              fontSize: '100px', 
              fontWeight: 900,
              letterSpacing: '-0.05em' 
            }}>
              ApplyBoost
            </span>
            <span style={{ 
              color: '#94a3b8', // slate-400
              fontSize: '32px', 
              fontWeight: 500,
              marginTop: '-10px'
            }}>
              Multiplica tus entrevistas.
            </span>
          </div>
        </div>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  )
}
