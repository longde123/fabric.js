(function () {

  var supportQuality = fabric.StaticCanvas.supports('toDataURLWithQuality');

  fabric.util.object.extend(fabric.StaticCanvas.prototype, /** @lends fabric.StaticCanvas.prototype */ {

    /**
     * Exports canvas element to a dataurl image. Note that when multiplier is used, cropping is scaled appropriately
     * @param {Object} [options] Options object
     * @param {String} [options.format=png] The format of the output image. Either "jpeg" or "png"
     * @param {Number} [options.quality=1] Quality level (0..1). Only used for jpeg.
     * @param {Number} [options.multiplier=1] Multiplier to scale by
     * @param {Number} [options.left] Cropping left offset. Introduced in v1.2.14
     * @param {Number} [options.top] Cropping top offset. Introduced in v1.2.14
     * @param {Number} [options.width] Cropping width. Introduced in v1.2.14
     * @param {Number} [options.height] Cropping height. Introduced in v1.2.14
     * @return {String} Returns a data: URL containing a representation of the object in the format specified by options.format
     * @see {@link http://jsfiddle.net/fabricjs/NfZVb/|jsFiddle demo}
     * @example <caption>Generate jpeg dataURL with lower quality</caption>
     * var dataURL = canvas.toDataURL({
     *   format: 'jpeg',
     *   quality: 0.8
     * });
     * @example <caption>Generate cropped png dataURL (clipping of canvas)</caption>
     * var dataURL = canvas.toDataURL({
     *   format: 'png',
     *   left: 100,
     *   top: 100,
     *   width: 200,
     *   height: 200
     * });
     * @example <caption>Generate double scaled png dataURL</caption>
     * var dataURL = canvas.toDataURL({
     *   format: 'png',
     *   multiplier: 2
     * });
     */
    toDataURL: function (options) {
      options || (options = { });

      var format = options.format || 'png',
          quality = options.quality || 1,
          multiplier = options.multiplier || 1,
          cropping = {
            left: options.left || 0,
            top: options.top || 0,
            width: options.width || 0,
            height: options.height || 0,
          };
      return this.__toDataURLWithMultiplier(format, quality, cropping, multiplier);
    },

    /**
     * @private
     */
    __toDataURLWithMultiplier: function(format, quality, cropping, multiplier) {

      var origWidth = this.width,
          origHeight = this.height,
          scaledWidth = (cropping.width || this.width) * multiplier,
          scaledHeight = (cropping.height || this.height) * multiplier,
          zoom = this.getZoom(),
          newZoom = zoom * multiplier,
          vp = this.viewportTransform,
          translateX = (vp[4] - cropping.left) * multiplier,
          translateY = (vp[5] - cropping.top) * multiplier,
          newVp = [newZoom, 0, 0, newZoom, translateX, translateY],
          originalInteractive = this.interactive,
          originalSkipOffScreen = this.skipOffscreen,
          needsResize = origWidth !== scaledWidth || origHeight !== scaledHeight;

      this.viewportTransform = newVp;
      this.skipOffscreen = false;
      // setting interactive to false avoid exporting controls
      this.interactive = false;
      if (needsResize) {
        this.setDimensions({ width: scaledWidth, height: scaledHeight }, { backstoreOnly: true });
      }
      // call a renderAll to force sync update. This will cancel the scheduled requestRenderAll
      // from setDimensions
      this.renderAll();
      var data = this.__toDataURL(format, quality, cropping);
      this.interactive = originalInteractive;
      this.skipOffscreen = originalSkipOffScreen;
      this.viewportTransform = vp;
      //setDimensions with no option object is taking care of:
      //this.width, this.height, this.requestRenderAll()
      if (needsResize) {
        this.setDimensions({ width: origWidth, height: origHeight }, { backstoreOnly: true });
      }
      this.renderAll();
      return data;
    },

    /**
     * @private
     */
    __toDataURL: function(format, quality) {

      var canvasEl = this.contextContainer.canvas;
      // to avoid common confusion https://github.com/kangax/fabric.js/issues/806
      if (format === 'jpg') {
        format = 'jpeg';
      }

      var data = supportQuality
        ? canvasEl.toDataURL('image/' + format, quality)
        : canvasEl.toDataURL('image/' + format);

      return data;
    },
  });

})();
