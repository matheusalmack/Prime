import React from 'react';
import './story-networks-visual.css';
export default function StoryNetworksVisual(){
 return <div className="story-networks-visual" role="img" aria-label="Templates para stories do Instagram e Facebook e Status do WhatsApp">
  <div className="story-networks-tray" aria-hidden="true">
   {['instagram','facebook','whatsapp'].map(network=><img key={network} className="story-network-ios" src={`/images/social-ios/${network}.jpg`} alt="" width="512" height="512"/>)}
  </div>
 </div>;
}
