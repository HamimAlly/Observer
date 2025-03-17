function searchStringEditDistance(a, b)
{
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    if (a === b) return 0;

    const matrix = [];
    for (let i = 0; i <= b.length; i++) {matrix[i] = [i];}
    for (let j = 0; j <= a.length; j++) {matrix[0][j] = j;}

    for (let i = 1; i <= b.length; i++)
    {
        for (let j = 1; j <= a.length; j++)
        {
            if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
            else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
        }
    }

    return matrix[b.length][a.length];
}

function searchCharsContains(a, b)
{
    if (a === b) return a.length;

    let contains = 0;
    const ind = new Set();
    for (let i = 0; i < b.length; i++) ind.add(b.charAt(i));
    for (let i = 0; i < a.length; i++) if (ind.has(a.charAt(i))) contains++;
    return contains;
}

function searchStringTokenize(name)
{
    const tokens = [];
    const string = name.replace(/([^A-Z])([A-Z][^A-Z])/g, '$1 $2').replace(/([A-Z0-9]{2,})/g, ' $1');
    const parts = string.split(/([\s\-_])/);

    for (let i = 0; i < parts.length; i++)
    {
        parts[i] = parts[i].toLowerCase().trim();
        if (parts[i] && parts[i] !== '-' && parts[i] !== '_') tokens.push(parts[i]);
    }
    return tokens;
}

function _searchItems(items, search, args)
{
    const results = [];

    for (const item of items)
    {
        if (item.subFull !== Infinity)
        {
            results.push(item);
            if (item.edits === Infinity) item.edits = 0;
            if (item.sub === Infinity) item.sub = item.subFull;
            continue;
        }

        if (item.name === search || item.name.indexOf(search) === 0)
        {
            results.push(item);
            if (item.edits === Infinity) item.edits = 0;
            if (item.sub === Infinity) item.sub = 0;
            continue;
        }

        const contains = searchCharsContains(search, item.name);
        if (contains / search.length < args.containsCharsTolerance) continue;

        let editsCandidate = Infinity;
        let subCandidate = Infinity;

        for (let t = 0; t < item.tokens.length; t++)
        {
            if (item.tokens[t] === search)
            {
                editsCandidate = 0;
                subCandidate = t;
                break;
            }

            const edits = searchStringEditDistance(search, item.tokens[t]);
            
            if ((subCandidate === Infinity || edits < editsCandidate) && item.tokens[t].indexOf(search) !== -1)
            {
                subCandidate = t;
                editsCandidate = edits;
                continue;
            }

            else if (subCandidate === Infinity && edits < editsCandidate)
            {
                if ((edits / Math.max(search.length, item.tokens[t].length)) <= args.editsDistanceTolerance) editsCandidate = edits;
            }
        }

        if (editsCandidate === Infinity) continue;

        results.push(item);
        item.edits = item.edits === Infinity ? editsCandidate : item.edits + editsCandidate;
        item.sub = item.sub === Infinity ? subCandidate : item.sub + subCandidate;
    }

    return results;
}

function searchItems(items, searchKey, search = '', args = {})
{
    search = search.toLowerCase().trim();
    if (!search) return [];

    const searchTokens = searchStringTokenize(search);
    if (!searchTokens.length) return [];

    args.containsCharsTolerance ??= 0.5;
    args.editsDistanceTolerance ??= 0.5;
    
    let records = items.map((item) => {
        const subInd = item[searchKey].toLowerCase().trim().indexOf(search);
        return {
            name: item[searchKey],
            item: item,
            tokens: searchStringTokenize(item[searchKey]),
            edits: Infinity,
            subFull: (subInd !== -1) ? subInd : Infinity,
            sub: Infinity
        };
    });

    for (let i = 0; i < searchTokens.length; i++) {records = _searchItems(records, searchTokens[i], args);}

    records.sort((a, b) => {
        if (a.subFull !== b.subFull) return a.subFull - b.subFull;
        else if (a.sub !== b.sub) return a.sub - b.sub;
        else if (a.edits !== b.edits) return a.edits - b.edits;
        return a.name.length - b.name.length;
    });

    let recordItems = records.map((record) => record.item);

    if (args.hasOwnProperty('limitResults') && recordItems.length > args.limitResults) recordItems = recordItems.slice(0, args.limitResults);
    return recordItems;
}

export { searchItems };