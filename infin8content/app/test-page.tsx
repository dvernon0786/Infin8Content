"use client";

export default function TestPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Page - Logo Debug</h1>
      <div style={{ 
        width: '192px', 
        height: '41px',
        borderRadius: '6px',
        background: 'linear-gradient(to right, #217CEB, #4A42CC)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        border: '3px solid red',
        margin: '20px 0'
      }}>
        I8 Infin8Content - TEST
      </div>
      <p>If you can see the red-bordered box above, the logo styling works!</p>
    </div>
  );
}
