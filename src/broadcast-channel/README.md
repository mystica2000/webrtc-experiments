# Basic WebRTC Video Streaming without using Signalling Server

Instead of using a signalling server, it takes advantage of BroadCast Channel API in the browser as signalling server to pass the offer/answer SDP messages.

1. Request video permission from user.
1. On make Offer on User A, it creates a offer and sends it to other tab (User B) using broadcast channel.
2. Upon receiving the offer, User B creates an answer and sends it back to User B using broadcast channel.
