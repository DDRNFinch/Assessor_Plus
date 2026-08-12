const ISO_DATE=/^(\d{4})-(\d{2})-(\d{2})$/;
const UK_DATE=/^(\d{2})-(\d{2})-(\d{4})$/;
export const UK_DATE_INPUT_ATTRIBUTES='type="date"';
export const UK_DATE_VALIDATION_MESSAGE='Enter a valid date in DD-MM-YYYY format.';

function valid(y,m,d){const date=new Date(Date.UTC(+y,+m-1,+d));return date.getUTCFullYear()===+y&&date.getUTCMonth()===+m-1&&date.getUTCDate()===+d}

/** Format an ISO date (or timestamp) without timezone-dependent day changes. */
export function formatUKDate(value){
  if(!value)return'';
  const match=String(value).slice(0,10).match(ISO_DATE);
  return match&&valid(match[1],match[2],match[3])?`${match[3]}-${match[2]}-${match[1]}`:'';
}

/** Parse an unambiguous DD-MM-YYYY value to the ISO value used in storage. */
export function parseUKDate(value){
  const match=String(value??'').trim().match(UK_DATE);
  return match&&valid(match[3],match[2],match[1])?`${match[3]}-${match[2]}-${match[1]}`:'';
}

export function isUKDate(value){return !!parseUKDate(value)}
