# bulletin-board-app V3.0
V3.0 has the following features:
uses polyline to record movement 
uses requestWakeLock and releaseWakeLock to prevent screen saver
makes use of hook useContext to avoid many props passing
using async await for MarkersByUrl
changes zoom level automaticaly based on speed of movement

V3.1 was created prior to V3.0 but added to github later. 
So it is not really a downgrade.
it is like V3.0 without:
not using useContext
not using requestWakeLock and releaseWakeLock
not using async await
it does:
uses polyline to record movement 
using async await for MarkersByUrl
changes zoom level automaticaly based on speed of movement

V3.2 is like V3.1 except for: 
It does not changes zoom level based on speed of movement