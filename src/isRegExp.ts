export default function isRegexp(value: any) {
  return toString.call(value) === '[object RegExp]'
}
