export default function (low, high, from, to, v) {
	const ratio = (v - low) / (high - low);
	return from + (to - from) * ratio;
}
