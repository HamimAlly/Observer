function arrayEquals(a, b)
{
    if (!a || !b) return false;

    var l = a.length;
    if (l !== b.length) return false;

    for (var i = 0; i < l; i++)
    {
        if (a[i] instanceof Array && b[i] instanceof Array)
        {
            if (!arrayEquals(a[i], b[i])) return false;
        }

        else if (a[i] !== b[i]) return false;
    }

    return true;
};

export { arrayEquals };