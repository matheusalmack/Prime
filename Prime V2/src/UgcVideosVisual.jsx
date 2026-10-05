import React from 'react';
import './ugc-videos-visual.css';
// Generated illustrative thumbnails; these are not playable customer videos.
export default function UgcVideosVisual(){
 return <div className="ugc-videos-visual" role="img" aria-label="Exemplos ilustrativos de vídeos UGC: mulheres apresentando organizadores, um ventilador portátil e um produto de skincare">
  {[0,1,2].map(index=><div key={index} className={`ugc-video-thumbnail ugc-video-thumbnail-${index}`} style={{backgroundPosition:`${index*50}% center`}} aria-hidden="true"/>)}
 </div>;
}
