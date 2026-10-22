let display = document.getElementById('display');
let currentInput = '';
let justCalculated = false;

const operators = ['+', '-', '*', '/'];

function updateDisplay(value = currentInput || '0') {
    display.textContent = value;
}

function clearDisplay() {
    currentInput = '';
    justCalculated = false;
    updateDisplay();
}

function deleteLast() {
    if (display.textContent === 'Error') {
        clearDisplay();
        return;
    }

    if (justCalculated) {
        clearDisplay();
        return;
    }

    currentInput = currentInput.slice(0, -1);
    updateDisplay();
}

function appendNumber(number) {
    if (display.textContent === 'Error') {
        clearDisplay();
    }

    if (justCalculated) {
        currentInput = '';
        justCalculated = false;
    }

    const lastNumber = currentInput.split(/[+\-*/]/).pop();

    if (number === '.') {
        if (lastNumber.includes('.')) {
            return;
        }

        if (lastNumber === '') {
            currentInput += '0';
            currentInput += '.';
            updateDisplay();
            return;
        }
    }

    currentInput += number;
    updateDisplay();
}

function appendOperator(operator) {
    if (display.textContent === 'Error') {
        clearDisplay();
    }

    if (operator === '%') {
        if (justCalculated) {
            justCalculated = false;
        }

        if (!currentInput || operators.includes(currentInput.slice(-1))) {
            return;
        }

        if (currentInput.endsWith('%')) {
            return;
        }

        currentInput += '%';
        updateDisplay();
        return;
    }

    if (justCalculated) {
        justCalculated = false;
    }

    if (!currentInput) {
        if (operator === '-') {
            currentInput = '-';
            updateDisplay();
        }
        return;
    }

    const lastChar = currentInput.slice(-1);

    if (operators.includes(lastChar)) {
        // Allow a negative number after an operator.
        if (operator === '-' && lastChar !== '-') {
            currentInput += operator;
        } else {
            currentInput = currentInput.slice(0, -1) + operator;
        }
    } else {
        currentInput += operator;
    }

    updateDisplay();
}

// A small expression parser avoids eval() and Function().
function evaluateExpression(expression) {
    let position = 0;

    function skipSpaces() {
        while (expression[position] === ' ') {
            position++;
        }
    }

    function parseNumber() {
        skipSpaces();

        let sign = 1;

        if (expression[position] === '+') {
            position++;
        } else if (expression[position] === '-') {
            sign = -1;
            position++;
        }

        skipSpaces();

        const start = position;
        let decimalCount = 0;

        while (
            position < expression.length &&
            /[0-9.]/.test(expression[position])
        ) {
            if (expression[position] === '.') {
                decimalCount++;
            }

            position++;
        }

        const numberText = expression.slice(start, position);

        if (!numberText || numberText === '.' || decimalCount > 1) {
            throw new Error('Invalid number');
        }

        let value = sign * Number(numberText);

        if (!Number.isFinite(value)) {
            throw new Error('Invalid number');
        }

        // Support postfix percentages, e.g. 200 * 10% = 20.
        while (expression[position] === '%') {
            value /= 100;
            position++;
        }

        return value;
    }

    function parseTerm() {
        let value = parseNumber();

        while (true) {
            skipSpaces();

            const operator = expression[position];

            if (operator !== '*' && operator !== '/') {
                break;
            }

            position++;

            const right = parseNumber();

            if (operator === '*') {
                value *= right;
            } else {
                if (right === 0) {
                    throw new Error('Division by zero');
                }

                value /= right;
            }

            if (!Number.isFinite(value)) {
                throw new Error('Invalid result');
            }
        }

        return value;
    }

    function parseExpression() {
        let value = parseTerm();

        while (true) {
            skipSpaces();

            const operator = expression[position];

            if (operator !== '+' && operator !== '-') {
                break;
            }

            position++;

            const right = parseTerm();

            if (operator === '+') {
                value += right;
            } else {
                value -= right;
            }

            if (!Number.isFinite(value)) {
                throw new Error('Invalid result');
            }
        }

        return value;
    }

    const result = parseExpression();

    skipSpaces();

    if (position !== expression.length) {
        throw new Error('Invalid expression');
    }

    return result;
}

function calculateResult() {
    if (!currentInput || display.textContent === 'Error') {
        return;
    }

    try {
        // Do not calculate incomplete expressions.
        if (
            operators.includes(currentInput.slice(-1)) ||
            currentInput.endsWith('.')
        ) {
            throw new Error('Incomplete expression');
        }

        const result = evaluateExpression(currentInput);

        if (!Number.isFinite(result)) {
            throw new Error('Invalid result');
        }

        // Reduce floating-point precision issues.
        currentInput = String(
            Number(result.toPrecision(12))
        );

        updateDisplay();
        justCalculated = true;
    } catch (error) {
        currentInput = '';
        justCalculated = false;
        updateDisplay('Error');
    }
}

// Keyboard support.
document.addEventListener('keydown', function (event) {
    const key = event.key;

    if (/^[0-9.]$/.test(key)) {
        event.preventDefault();
        appendNumber(key);
    } else if (operators.includes(key) || key === '%') {
        event.preventDefault();
        appendOperator(key);
    } else if (key === 'Enter' || key === '=') {
        event.preventDefault();
        calculateResult();
    } else if (key === 'Backspace') {
        event.preventDefault();
        deleteLast();
    } else if (key === 'Escape' || key === 'Delete') {
        event.preventDefault();
        clearDisplay();
    }
});
