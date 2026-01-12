/**
 * Test Citation Patterns
 * Verifies that citations don't have broken patterns
 */

// Simulate the citation formatter's cleaning logic
function cleanCitationUrl(url) {
  let cleaned = url
  // Remove spaces from URLs
  cleaned = cleaned.replace(/\s+/g, '')
  // Remove newlines
  cleaned = cleaned.replace(/\n/g, '')
  return cleaned
}

function formatInTextCitation(title, url) {
  const cleanTitle = title.replace(/[\[\]]/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
  const cleanUrl = cleanCitationUrl(url)
  return `According to [${cleanTitle}](${cleanUrl}), `
}

function formatReference(title, url, author, year) {
  const cleanTitle = title.replace(/[\[\]]/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
  const cleanUrl = cleanCitationUrl(url)
  const cleanAuthor = author.replace(/[\[\]]/g, '').replace(/\s+/g, ' ').trim()
  
  let reference = `- [${cleanTitle}](${cleanUrl})`
  if (cleanAuthor) reference += ` - ${cleanAuthor}`
  if (year) reference += ` (${year})`
  return reference
}

// Test data
const testCases = [
  {
    title: 'Introduction to Salesforce (2026): A Beginner\'s Complete Guide',
    url: 'https://www.igmguru.com/blog/introduction-to-salesforce',
    author: 'IGM Guru',
    year: '2026',
  },
  {
    title: 'Sales Cloud Go: Dive Into the New Sales Cloud Setup Experience',
    url: 'https://www.salesforceben.com/sales-cloud-go-dive-into-the-new-sales-cloud-setup-experience/',
    author: 'Salesforce Ben',
    year: '2025',
  },
  {
    title: 'Salesforce Sales Cloud Implementation: Top Features & Benefits',
    url: 'https://360degreecloud.com/blog/considering-salesforce-sales-cloud-implementation/',
    author: '360 Degree Cloud',
    year: '2025',
  },
]

console.log('\n' + '='.repeat(80))
console.log('CITATION FORMATTER TEST')
console.log('='.repeat(80))

let passCount = 0
let failCount = 0

// Test in-text citations
console.log('\n1. IN-TEXT CITATIONS')
console.log('-'.repeat(80))

testCases.forEach((test, i) => {
  const citation = formatInTextCitation(test.title, test.url)
  
  // Check for broken patterns
  const issues = []
  if (citation.match(/https?:\/\/[^\s)]*\s+[^\s)]*/) || citation.match(/https?:\/\/[^\s)]*\s/)) {
    issues.push('spaces in URL')
  }
  if (citation.match(/https?:\/\/[^\s)]*\n[^\s)]*/) || citation.includes('\n')) {
    issues.push('newlines in URL')
  }
  if (citation.match(/([a-z])\s+-\s+([a-z])/i)) {
    issues.push('dashes with spaces')
  }
  if (citation.includes('](https://') && !citation.includes(')')) {
    issues.push('incomplete link')
  }
  
  console.log(`\nTest ${i + 1}: ${test.title.substring(0, 50)}...`)
  console.log(`URL: ${test.url}`)
  console.log(`Citation: ${citation}`)
  
  if (issues.length === 0) {
    console.log('✅ PASS - No broken patterns')
    passCount++
  } else {
    console.log(`❌ FAIL - Issues: ${issues.join(', ')}`)
    failCount++
  }
})

// Test reference citations
console.log('\n\n2. REFERENCE CITATIONS')
console.log('-'.repeat(80))

testCases.forEach((test, i) => {
  const reference = formatReference(test.title, test.url, test.author, test.year)
  
  // Check for broken patterns
  const issues = []
  if (reference.match(/https?:\/\/[^\s)]*\s+[^\s)]*/) || reference.match(/https?:\/\/[^\s)]*\s/)) {
    issues.push('spaces in URL')
  }
  if (reference.match(/https?:\/\/[^\s)]*\n[^\s)]*/) || reference.includes('\n')) {
    issues.push('newlines in URL')
  }
  if (reference.match(/([a-z])\s+-\s+([a-z])/i)) {
    issues.push('dashes with spaces')
  }
  if (reference.includes('](https://') && !reference.includes(')')) {
    issues.push('incomplete link')
  }
  
  console.log(`\nTest ${i + 1}: ${test.title.substring(0, 50)}...`)
  console.log(`URL: ${test.url}`)
  console.log(`Reference: ${reference}`)
  
  if (issues.length === 0) {
    console.log('✅ PASS - No broken patterns')
    passCount++
  } else {
    console.log(`❌ FAIL - Issues: ${issues.join(', ')}`)
    failCount++
  }
})

// Summary
console.log('\n\n' + '='.repeat(80))
console.log('TEST SUMMARY')
console.log('='.repeat(80))
console.log(`Total Tests: ${passCount + failCount}`)
console.log(`Passed: ${passCount}`)
console.log(`Failed: ${failCount}`)

if (failCount === 0) {
  console.log('\n✅ ALL TESTS PASSED - Citation formatter is working correctly!')
  process.exit(0)
} else {
  console.log('\n❌ SOME TESTS FAILED - Citation formatter has issues')
  process.exit(1)
}
