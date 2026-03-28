import { ImageResponse } from 'next/og'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // Favicon JSX
      <div
        style={{
          fontSize: 18,
          background: '#2563eb', // blue-600
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '8px',
          fontWeight: 800,
          fontFamily: 'sans-serif',
          letterSpacing: '-0.05em',
        }}
      >
        AB
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  )
}
