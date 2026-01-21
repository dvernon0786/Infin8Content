// Test CSS Variables in Browser Console
// Run this in DevTools Console on any dashboard page

function testCSSVariables() {
    const rootStyle = getComputedStyle(document.documentElement);
    const primaryBlue = rootStyle.getPropertyValue('--color-primary-blue').trim();
    const primaryPurple = rootStyle.getPropertyValue('--color-primary-purple').trim();
    
    console.log('=== CSS Variables Test ===');
    console.log('--color-primary-blue:', `"${primaryBlue}"`);
    console.log('--color-primary-purple:', `"${primaryPurple}"`);
    console.log('Expected primary blue: #217CEB');
    console.log('Expected primary purple: #4A42CC');
    
    // Test if variables are actually working
    const testDiv = document.createElement('div');
    testDiv.style.cssText = 'background-color: var(--color-primary-blue); width: 100px; height: 50px; position: fixed; top: 10px; right: 10px; z-index: 9999;';
    document.body.appendChild(testDiv);
    
    const computedBg = getComputedStyle(testDiv).backgroundColor;
    console.log('Computed background color:', computedBg);
    
    // Clean up
    setTimeout(() => testDiv.remove(), 5000);
    
    return {
        primaryBlue,
        primaryPurple,
        computedBg,
        isWorking: primaryBlue === '#217CEB' && primaryPurple === '#4A42CC'
    };
}

// Auto-run
testCSSVariables();
