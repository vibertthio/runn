function lerp (low, high, from, to, v) {
	const ratio = (v - low) / (high - low);
	return from + (to - from) * ratio;
}

function clamp(value, min, max) {
	return Math.max(min, Math.min(max, value));
}

export {
	lerp,
	clamp,
};