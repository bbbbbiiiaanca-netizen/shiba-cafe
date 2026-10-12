# Art demo

Serve the repository with `python3 -m http.server 8000`, then open `/art-demo/`.
Drag to pan; pinch or use the wheel to zoom. Settings resets the camera. The cart icon explains the loop, and the list icon shows visit counts. Furniture is fixed.

Three customers enter, sit still, wait for visiting shibas, and leave after two completed visits. Three shibas wander with bobbing and direction flips. Each table admits one shiba at a time; hearts appear during petting. Departing customers are replaced.

Run `node art-demo/tests/sim.test.js` for the 90-second simulation check. `?shot=seated` and `?shot=heart` freeze reference states for inspection.

`extract.py` requires Pillow, numpy and OpenCV. All artwork comes from `ref/*.jpg`. Floor restoration copies reference pixels along isometric axes; gradient blending joins patches. The extensions use a warm cream backdrop sampled from `original.jpg`, with a subtle vertical gradient and feathered target edges. No scenery is mirrored or repeated. Camera bounds cover the complete extended image at every supported zoom.

Chrome captures and the equal-height comparison are in `/workspace/shiba-cafe-docs/art-demo-shots/`.
