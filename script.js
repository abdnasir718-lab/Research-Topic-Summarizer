const searchForm = document.getElementById('searchForm');
const topicInput = document.getElementById('topicInput');
const searchBtn = document.getElementById('searchBtn');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const summaryText = document.getElementById('summaryText');
const trendsList = document.getElementById('trendsList');
const errorText = document.getElementById('errorText');
const copyBtn = document.getElementById('copyBtn');
const retryBtn = document.getElementById('retryBtn');

let isLoading = false;

function setLoading(loading) {
    isLoading = loading;
    const btnText = searchBtn.querySelector('.btn-text');
    const spinner = searchBtn.querySelector('.spinner');

    searchBtn.disabled = loading;

    if (loading) {
        btnText.classList.add('hidden');
        spinner.classList.remove('hidden');
    } else {
        btnText.classList.remove('hidden');
        spinner.classList.add('hidden');
    }
}

function showResults() {
    resultsSection.classList.remove('hidden');
    errorSection.classList.add('hidden');
}

function showError(message) {
    errorSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    errorText.textContent = message;
}

function parseTrendsFromText(text) {
    const trends = [];
    const lines = text.split('\n');

    for (const line of lines) {
        const cleaned = line.replace(/^[-•*#\d.)\s]+/g, '').trim();
        if (cleaned.length > 10 && cleaned.length < 200) {
            trends.push(cleaned);
        }
    }

    if (trends.length < 2) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
        return sentences.slice(0, 5).map(s => s.trim());
    }

    return trends.slice(0, 5);
}

function displayResults(data) {
    const fullText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const parts = fullText.split(/(?=Trend|Key Trends|Trends:|$)/i);

    let summary = '';
    let trendsText = '';

    for (const part of parts) {
        if (part.toLowerCase().includes('trend') || part.toLowerCase().includes('key')) {
            trendsText += part;
        } else {
            summary += part;
        }
    }

    if (!summary && fullText) {
        const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 30);
        if (sentences.length >= 2) {
            summary = sentences.slice(0, 3).join('. ').trim() + '.';
            trendsText = sentences.slice(3).join(' ');
        } else {
            summary = fullText;
            trendsText = '';
        }
    }

    summaryText.textContent = summary || fullText;

    trendsList.innerHTML = '';
    const trends = parseTrendsFromText(trendsText || fullText);

    if (trends.length > 0) {
        trends.forEach(trend => {
            const li = document.createElement('li');
            li.textContent = trend;
            trendsList.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = 'Could not extract specific trends from response.';
        trendsList.appendChild(li);
    }
}

async function handleSubmit(e) {
    e.preventDefault();

    const topic = topicInput.value.trim();

    if (!topic) {
        showError('Please enter a research topic.');
        return;
    }

    setLoading(true);
    showResults();
    summaryText.textContent = 'Loading summary...';
    trendsList.innerHTML = '<li>Loading trends...</li>';

    try {
        const response = await fetch('/api/summarize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ topic }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to get summary');
        }

        displayResults(data);
        setLoading(false);
    } catch (err) {
        setLoading(false);
        showError(err.message || 'Something went wrong. Please try again.');
    }
}

async function copyResults() {
    const summary = summaryText.textContent;
    const trends = Array.from(trendsList.querySelectorAll('li'))
        .map(li => `• ${li.textContent}`)
        .join('\n');

    const fullText = `Research Summary: ${topicInput.value}\n\n${summary}\n\nKey Trends:\n${trends}`;

    try {
        await navigator.clipboard.writeText(fullText);
        copyBtn.classList.add('copied');
        copyBtn.querySelector('.copy-text').textContent = 'Copied!';

        setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.querySelector('.copy-text').textContent = 'Copy';
        }, 2000);
    } catch {
        showError('Failed to copy to clipboard');
    }
}

searchForm.addEventListener('submit', handleSubmit);
copyBtn.addEventListener('click', copyResults);
retryBtn.addEventListener('click', () => {
    topicInput.focus();
});