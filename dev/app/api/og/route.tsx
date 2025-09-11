import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'RodColoc - Colocation à La Réunion';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'RodColoc - Colocation à La Réunion';
    const description = searchParams.get('description') || 'Trouvez votre colocataire idéal à La Réunion';
    const category = searchParams.get('category') || '';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0ea5e9',
            backgroundImage: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #14b8a6 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background decoration */}
          <div
            style={{
              position: 'absolute',
              top: '-200px',
              right: '-200px',
              width: '400px',
              height: '400px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              filter: 'blur(60px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-200px',
              left: '-200px',
              width: '400px',
              height: '400px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              filter: 'blur(60px)',
            }}
          />
          
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#0ea5e9',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
              }}
            >
              R
            </div>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: title.length > 50 ? '48px' : '56px',
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              maxWidth: '900px',
              lineHeight: 1.2,
              marginBottom: '20px',
              textShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            {title}
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: '24px',
              color: '#e0f2fe',
              textAlign: 'center',
              maxWidth: '800px',
              lineHeight: 1.4,
              marginBottom: '30px',
            }}
          >
            {description}
          </div>

          {/* Category badge */}
          {category && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '25px',
                fontSize: '18px',
                fontWeight: '600',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                marginBottom: '20px',
              }}
            >
              {category}
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              color: 'white',
              fontSize: '20px',
              fontWeight: '600',
            }}
          >
            <span style={{ marginRight: '10px' }}>🌺</span>
            RodColoc - Colocation à La Réunion
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
