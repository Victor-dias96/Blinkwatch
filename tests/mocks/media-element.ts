type MediaElementWithSrcObject = HTMLMediaElement & {
  _srcObject?: MediaStream | null;
};

export function installSrcObjectPolyfill(): void {
  if (
    Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'srcObject')
  ) {
    return;
  }

  Object.defineProperty(HTMLMediaElement.prototype, 'srcObject', {
    configurable: true,
    enumerable: true,
    get(this: MediaElementWithSrcObject) {
      return this._srcObject ?? null;
    },
    set(this: MediaElementWithSrcObject, value: MediaStream | null) {
      this._srcObject = value;
    },
  });
}
