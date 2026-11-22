import { useId } from 'react'

// All parts are drawn in their local resting pose. The navigator moves the named pivots.
function Arm({ near }: { near: boolean }) {
  const side = near ? 'near' : 'far'
  const skin = near ? '#e9a774' : '#c78960'
  return <g transform={near ? 'translate(42 62)' : 'translate(62 61)'}>
    <g data-joint={side + 'Shoulder'}>
      <path d="M-3 -1Q.4 -5 3.1 -.8C4.5 3 3.2 9 3.1 14.9Q3.1 19.5 .2 20.4Q-2.3 20.9 -3.3 17.2L-4.2 7Q-4.8 2 -3 -1Z" fill={skin}/>
      <path d="M-2.6 4Q-.8 7.9 -2.1 12.5" fill="none" stroke="#ac6b50" strokeWidth="1"/>
      <g transform="translate(0 17.5)"><g data-joint={side + 'Elbow'}>
        <path d="M-2.8 -2Q.2 -4 2.8 -1.5Q4.2 1.3 3.2 6.8L2.4 14.8 -2.1 15Q-3.1 9.3 -3.8 4.1Q-4.1 .5 -2.8 -2Z" fill={skin}/>
        <g transform="translate(0 14)"><g data-joint={side + 'Wrist'}>
          <path className="sailor-fist" d="M-2.6 -1.2Q.2 -2.4 2.7 -.3L4.2 2.3 3.8 5.4 1.1 7.1 -2.8 5.9 -3.5 4.4 -4.5 3.6 -4 1.5Z" fill={skin}/>
          <path className="sailor-fist" d="M-1.3 5.8 -.9 3.9m2.7 2.3 .2-2.2" fill="none" stroke="#9a614b" strokeWidth=".75"/>
          {near && <><path className="sailor-palm" d="M-2.4 -.8Q.1 -2.2 2.1 -.6L4.6 1.8Q6.5 4.2 5.2 4.9L3 3.8 3 8Q2.5 10.1 1.3 8.1L.5 6.6Q.7 11 -1 10L-2.2 6.9Q-2.7 10.4 -3.9 8.9L-4.4 4.7Q-5.2 7.3 -6.1 6.1L-5.6 1.9Z" fill={skin}/>
          <path className="sailor-index" d="M-2.4 -.8Q.2 -2.2 2.3 -.4L4.4 2.4 4 5.6 1.1 6.7 -.6 5.4 -1.9 9.6Q-2.9 11.5 -4.1 10L-3.1 3.5 -4.4 2.2Z" fill={skin}/></>}
        </g></g>
      </g></g>
    </g>
  </g>
}

function Leg({ near }: { near: boolean }) {
  const side = near ? 'near' : 'far'
  return <g transform={near ? 'translate(46 89)' : 'translate(58 89)'}>
    <g data-joint={side + 'Hip'}>
      <path d="M-5.2 -.5Q.9 -3.2 5.7 .4L5.1 16.7Q.5 19.1 -5.2 16.9L-6 7.3Z" fill={near ? '#436b74' : '#2f4d59'}/>
      <path d="M-5.3 12.8Q-.6 14.7 5.2 13.2L5.9 17.9Q.9 20.8 -5.6 18.7Z" fill={near ? '#d1c9ac' : '#afa993'}/>
      <g transform="translate(0 17.4)"><g data-joint={side + 'Knee'}>
        <path d="M-3.6 -.8Q.3 1.1 3.9 -.6L3.6 6.3Q2.9 11.7 2.1 16.9L-2.3 17.3Q-2.3 11.1 -3.8 7.5Q-5 3.3 -3.6 -.8Z" fill={near ? '#dea074' : '#c48a64'}/>
        <g transform="translate(0 16.2)"><g data-joint={side + 'Foot'}>
          <path d="M-2.7 -.8Q.2 .2 2.4 -.6L3.4 2.2 2.3 4.6 -6.4 5 -8.6 4 -8.3 2.7 -4.1 1.4Z" fill="#d69a6c"/>
          <path d="M-8.6 3.4Q-4.1 4.8 2.9 2.8L3.4 4.9Q-1.7 7 -8.1 5.8Z" fill="#72503d"/>
          <path d="M-5 1.5 -2.9 3.8 .9 .1" fill="none" stroke="#4d3d33" strokeWidth="1.3"/>
        </g></g>
      </g></g>
    </g>
  </g>
}

export default function PirateFigure() {
  const id = 'brim' + useId().replace(/[^a-z0-9_-]/gi, '')
  return <svg className="sailor-art" viewBox="-9 1 120 141" fill="none" aria-hidden="true" focusable="false">
    <defs><pattern id={id} width="5.4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-11)">
      <path d="M0 1.3h3.6m.5 2.2h1.3" stroke="#815630" strokeWidth=".68" opacity=".62"/>
    </pattern></defs>
    <g data-joint="root" stroke="#252223" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
      <g className="sailor-breathe"><g data-joint="spine">
        <Arm near={false}/><Leg near={false}/><Leg near/>
        <path d="M42 59Q49 56.3 55.8 57.9L61.8 60.2 62.6 73.4 60.9 86.1Q52.4 90.2 42 85.6L40.2 73.6Z" fill="#e6a577"/>
        <path d="M46 66Q48 67.6 49.7 66.3M53.5 66.6Q56.3 67.8 58.6 65.9m-8 7.2-.7 4.7m-2.3 4 3.7.3" stroke="#b47456" strokeWidth=".9"/>
        <path d="M41.7 58.7 47.3 57.8 45.4 69.4 47.2 83.2 39.4 87.5 37.9 79.2 39.4 67.7Z" fill="#b7513e"/>
        <path d="M55.5 58.1 61.9 58.9 65.4 63.7Q61.1 70.9 63.6 78.5L66.5 85.9 58.3 87.5 54.3 77.2Z" fill="#bc5540"/>
        <path d="m58.2 60.8-1.4 16.3 3.1 5" stroke="#dd8162" strokeWidth="1.1"/>
        <g fill="#eac485" strokeWidth=".6"><circle cx="58.8" cy="68.7" r="1"/><circle cx="58.3" cy="74.8" r="1"/></g>
        <path d="M40.9 83.8Q51.8 86.5 61.7 82.8L62.5 88.4Q51.8 92 41.3 89.1Z" fill="#d8a652"/>
        <path d="M59.9 86.3Q66.6 87.4 69.3 84.8L67.1 90.2 70 93.6Q65.3 94.3 59.6 89.4Z" fill="#c99a51"/>
        <path d="M43.5 87.5Q50.1 89.3 57.5 87.6" stroke="#956d40" strokeWidth=".85"/>
        <path d="m47.7 53.5.4 7.2q3.4 4.1 7.2-.3l.7-8" fill="#d18e65"/>
        <g data-joint="head">
          <path d="M34.4 31.3Q42.6 18.9 59 23.2 68.8 25.9 71 37.6L73.2 44.8 69.7 43.5 70.7 49.2 66.2 47.9 66.2 53.4 61.3 50.8 58.9 55.3 53.8 53.7 42 50.9Z" fill="#242426"/>
          <path d="M35.9 32.4Q42.6 26.8 53.6 29.2 61.3 30.1 64.5 36.1L62.2 44.8Q65.6 40.2 67.2 43.4 68.3 47.3 62.1 50L58.7 52.5Q53.2 59 46.6 57.2 40 55.1 36.5 49.9L33.4 47.7 34.2 45.4 32.1 44.5 34.8 40.5Z" fill="#ecae80"/>
          <path d="M63.2 45.6q2.4-2.6 2.2-.3l-1.8 2" stroke="#ad7154" strokeWidth=".9"/>
          <path d="M35.4 41q2.4-2.4 5.1-.8m5.2.7q3.5-2.1 6.6.1" stroke="#352822" strokeWidth="1.35"/>
          <g className="sailor-eyes" fill="#f8e4c3" strokeWidth=".9"><path d="M35.6 42.8q2.2-1.8 4.9.4-2.8 2.9-4.9-.4Zm10.3.9q3.5-2.4 6.8.2-3.7 3.2-6.8-.2Z"/>
            <g data-joint="gaze" fill="#241f20" stroke="none"><circle cx="37.1" cy="43" r="1.15"/><circle cx="47.8" cy="44" r="1.35"/></g>
          </g>
          <path className="sailor-smile" d="M39.9 49.6q5 3.6 9.1.3-3.8 5.7-8.8.6Z" fill="#fff0d7" strokeWidth="1.1"/>
          <path className="sailor-thinking" d="M40.3 50.5q2.1 1.1 5.7-.5" strokeWidth="1.15"/>
          <g className="sailor-grin"><path d="M39 48.9q5.4 3.3 12.1-.5-3.2 9.8-8.7 5.3-2.8-2.1-3.4-4.8Z" fill="#774737" strokeWidth="1.05"/>
            <path d="M40.4 50q4.8 1.7 8.9-.3l-1.1 1.8q-3.9 1.2-6.7-.1Z" stroke="none" fill="#fff0d7"/></g>
          <path className="sailor-squint" d="M35 43.8q1.9-3.4 5.2-.4m5.9.8q2.6-3.3 6.3-.4" strokeWidth="1.5"/>
          <path d="m49 47.4 5.4.6m-4.1-1.6-.3 2m2.6-1.9-.4 2" stroke="#a46b52" strokeWidth=".85"/>
          <path d="M34.5 30.6Q46.4 24.5 62.6 30.2L66.9 37.8 63.7 42.9 61.6 38.8 58.7 43.8 56.2 36.5 51.9 39.1 52.9 34.1 47.1 38.4 46.8 34.3 41.2 38.6 41.1 35.6 36.1 39.2 36.2 36.2 31.4 39.3Z" fill="#27252a"/>
          <g data-joint="hat" transform="rotate(-7 49 31)">
            <path d="M30.6 26.4Q30.3 18.8 36.7 14.1 42.9 9.1 53.7 10.1 64.6 10.3 69 17.3L72.9 28.4Z" fill="#dfb369"/>
            <path d="M30.6 26.4Q30.3 18.8 36.7 14.1 42.9 9.1 53.7 10.1 64.6 10.3 69 17.3L72.9 28.4Z" fill={'url(#'+id+')'} stroke="none"/>
            <path d="M30.7 23.9Q49 27.6 70.7 23.8L72.3 29Q50.3 34 29.5 29Z" fill="#a54d3d"/>
            <path d="M18.3 28.7Q24.1 26.4 30.9 27.8 50.6 31.6 71.3 27.5 77.5 26.5 84.4 28.6 88.8 30.5 86.6 32.2 70.3 37.6 45.6 35.9 24.8 34.6 16.5 31.6 14 30.2 18.3 28.7Z" fill="#ecc67c"/>
            <path d="M18.9 30.7Q49 38.8 83.3 30.7m-61.8-1 .7 2.2m3.6-1.5.8 2.1m49.2-3-.6 2.3m4.2-3.1-.3 2" stroke="#9d7843" strokeWidth=".9"/>
          </g>
        </g>
        <Arm near/>
      </g></g>
    </g>
  </svg>
}
