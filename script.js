const axios = require('axios')
require('dotenv').config()
const fs = require('fs')
const CSVToJSON = require('csvtojson')
const JSONToCSV = require('json2csv').parse

const importFile = process.env.IMPORT
const exportFile = process.env.EXPORT

const search = async (term, author) => {
    console.log(term)
    console.log(author)
    try {
        const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${term}+inauthor:${author}`)
        return findISBN(response.data)
    }
    catch (error) {
        console.error(`async error: ${error}`)
    }
}

const findISBN = (input) => {
    // store output in these
    let returnIsbnten = ''
    let returnIsbnthirteen = ''

    // grab first result
    let targetObject = input.items[0]

    // populate ISBNs
    let twoIsbns = targetObject.volumeInfo.industryIdentifiers

    twoIsbns.forEach(isbn => (
        isbn.type === 'ISBN_13' ?
            returnIsbnthirteen = isbn.identifier :
            returnIsbnten = isbn.identifier
    ))

    return [returnIsbnten, returnIsbnthirteen]
}

const createLibrary = async (inputFile, outputFile) => {
    let isbnJSON = []

    // Read data and convert to JSON
    const operatingJSON = await CSVToJSON().fromFile(inputFile)

    let length = operatingJSON.length

    // Search for ISBNs and add ISBNs to JSON
    for (let x = 0; x < length; x++) {

        let term = operatingJSON[x].term
        let author = operatingJSON[x].author

        try {
            let [isbn10, isbn13] = await search(term, author) // search returns an array of isbns

            isbnJSON.push({
                'isbn 10': isbn10,
                'isbn 13': isbn13
            })
        } catch (err) {
            console.error(err)
        } finally {
            continue
        }
    }

    // Convert JSON to .csv
    const output = JSONToCSV(isbnJSON, {
        fields: ["isbn 10", "isbn 13"]
    })

    // Write to output file
    fs.writeFileSync(outputFile, output)

}

createLibrary(importFile, exportFile)