#!/usr/bin/env node

const fs = require('fs')

/**
 * anchore-result-diff is a tool for diffing the evaluated results from 2 anchore image scans.
 * This is useful for comparing a base image's vulnerabilities vs. a derived image's vulnerabilities
 * It helps answer the question: 'Did I add anything in my Dockerfile that compromised this image?'
 * 
 * Usage:
 *  ./anchore-result-diff.js <base-image-results.json> <derived-image-results.json>
 */


function getRowsAndFormat(fileName) {
  // TODO: replace these with better getPath tool which can get nested and handle errors more gracefully
  const baseFile = fs.readFileSync(fileName)
  const base = JSON.parse(baseFile.toString())

  // This assumes only one image and digest, should be fine for now
  const imageDigest = Object.keys(base[0])[0]
  const fullImageName = Object.keys(base[0][imageDigest])[0]
  const anchoreImageId = base[0][imageDigest][fullImageName][0].detail.result.image_id

  const baseRows = base[0][imageDigest][fullImageName][0].detail.result.result[anchoreImageId]
  const rowFormat = baseRows.result.header
  const rows = baseRows.result.rows

  return {
    rowFormat,
    rows
  }
}

function arrayEquals(arr1, arr2) {
  if (arr1.length == arr2.length && arr1.every((v) => arr2.indexOf(v) >= 0)) {
    return true
  }

  return false
}


/**
 * Find the LEFT difference between 2 arrays
 * 
 * If value is found in both arrays, it will be removed.
 * If a value is found in arr1 (left), it will be returned
 * If a value is in arr2, but not arr 1 it will be _ignored_
 * 
 * Example:
 *  arraySubtract([1, 2, 3, 4, 5], [1, 3, 5, 6], (row) => row)
 *  returns: [2, 4]
 */
function arraySubtract(arr1, arr2, uniqueAccessorFunc) {
  const finalArray = []

  const arr1Dict = {}
  arr1.forEach(row => {
    const key = uniqueAccessorFunc(row)
    arr1Dict[key] = row
  })

  const arr2Dict = {}
  arr2.forEach(row => {
    const key = uniqueAccessorFunc(row)
    arr2Dict[key] = row
  })

  Object.keys(arr1Dict).forEach(key => {
    //if not found in arr2, then it is the difference!
    if (!arr2Dict[key]) {
      finalArray.push(arr1Dict[key])
    }
  })

  return finalArray
}

function main() {
  if (process.argv.length !== 4) {
    console.warn('Usage: ./anchore-result-diff.js <base-image-results.json> <derived-image-results.json>')
    process.exit(1)
  }

  // TODO: Validate the format of the file to ensure it's the right one?
  const baseRowsAndFormat = getRowsAndFormat(process.argv[2])
  const baseFormat = baseRowsAndFormat.rowFormat
  const baseRows = baseRowsAndFormat.rows

  const derivedRowsAndFormat = getRowsAndFormat(process.argv[3])
  const derivedFormat = derivedRowsAndFormat.rowFormat
  const derivedRows = derivedRowsAndFormat.rows
  
  // Get the image format, and ensure it is consistent between files
  if (!arrayEquals(baseFormat, derivedFormat)) {
    console.log(`2 result formats don't match. Check the output and try again.`)
    process.exit(1)
    return;
  }

  const checkOutputIndex = baseFormat.indexOf('Check_Output')
  const triggerIdIndex = baseFormat.indexOf('Trigger_Id')

  // Find the rows present in the derived image that aren't in the base image
  const derivedRemainingRows = arraySubtract(derivedRows, baseRows, (row) => `${row[triggerIdIndex]}`)

  console.log(JSON.stringify(derivedRemainingRows, null, 2))

  process.exit(0)
}

main();
