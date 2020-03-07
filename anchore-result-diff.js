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
  // TODO: replace these with better getPath tool which can get nested
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

  process.exit(0)
}

main();
