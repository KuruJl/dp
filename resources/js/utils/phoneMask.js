export function formatRuPhone(value) {
    const digits = String(value ?? '').replace(/\D/g, '');

    if (!digits) return '';

    // normalize to 11 digits with leading 8
    let d = digits;
    if (d[0] === '7') d = '8' + d.slice(1);
    if (d[0] !== '8') d = '8' + d;
    d = d.slice(0, 11);

    const a = d.slice(1, 4);
    const b = d.slice(4, 7);
    const c = d.slice(7, 9);
    const e = d.slice(9, 11);

    let out = '8';
    if (a) out += `(${a}`;
    if (a.length === 3) out += ')';
    if (b) out += b;
    if (c) out += `-${c}`;
    if (e) out += `-${e}`;
    return out;
}

export function ruPhoneToDigits(value) {
    const digits = String(value ?? '').replace(/\D/g, '');
    if (!digits) return '';
    let d = digits;
    if (d[0] === '7') d = '8' + d.slice(1);
    if (d[0] !== '8') d = '8' + d;
    return d.slice(0, 11);
}

