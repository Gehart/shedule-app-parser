const xlsx_node = require('node-xlsx'),
      xlsx      = require('xlsx'),
      fs        = require('fs');

const resourcesDir = 'resources/';
// const xlsFile = 'short_shedule.xlsx';
const xlsFile = 'univ_shedule.xls';
const workbook = xlsx.readFile(resourcesDir + xlsFile, {
    raw: false,
    cellText: false,
    celHTML: false,
    cellStyles: false,
    cellDates: true
});

// объект с адресами основных колонок - времени занятий, группы, аудитории
const sheduleBase = {
    nOfSheet: 2,
    dayOfWeek: 0,
    nOfLesson: 1,
    timeOfLesson: 2,
    evenOdd: 3,
    group: <ColumnRange>{
        "start": 12,
        "end": 13 
    },
    subgroup: 13,
    typeOfLesson: 14, 
    classroom: 15,
    startRowOfSheet: 8,
    endRowOfSheet: 90,
    // dayOfWeek: 'A',
    // nOfLesson: 'B',
    // timeOfLesson: 'C',
    // evenOdd: 'D',
    // group: {
    //     "s": {
    //         "c": 4,
    //         "r": 0
    //     },
    //     "e": {
    //         "c": 5,
    //         "r": 0
    //     }
    // },
    // subgroup: 'F',
    // typeOfLesson: 'G', 
    // classroom: 'H',
};

const sheetName = workbook.SheetNames[sheduleBase.nOfSheet];
const workingSheet = workbook.Sheets[sheetName];

main();
function main() {
    const parsedDay = parseDay({start: 22, end: 35});
    
    // const dayRanges = findDaysRanges();
}

function writeFile(outputFile : string, object: any) {
    const wbSheet = JSON.stringify(object); 
    fs.writeFile(outputFile, wbSheet, 'utf8', (err) => {
        if (err) {
            throw err;
        }
    });
}

function findDaysRanges(): RowRange[] {
    const docMerges = workingSheet['!merges'];
    console.log(docMerges);

    return [];
}

interface Shedule {
    odd?: {
        monday?: Lesson[],
        tuesday?: Lesson[],
        wednesday?: Lesson[],
        thursday?: Lesson[],
        friday?: Lesson[],
        sunday?: Lesson[]
    },
    even?: {
        monday?: Lesson[],
        tuesday?: Lesson[],
        wednesday?: Lesson[],
        thursday?: Lesson[],
        friday?: Lesson[],
        sunday?: Lesson[]
    }
}

interface RowRange {
    start: number,
    end: number
}

interface ColumnRange {
    start: number,
    end: number
}

// TODO: сделать нормальный тип возврата
function parseDay(rowRange: RowRange): Shedule {
    const startRowOfDay = rowRange.start;
    const endRowOfDay = rowRange.end;
    const day: Shedule = {
        odd: {
            friday: []
        },
        even: {
            friday: []
        }
    };

    for (let i = 0; i < endRowOfDay - startRowOfDay + 1; i++) {
        const currentRow = i + startRowOfDay;
        const cellValue = getCellValue({c: sheduleBase.subgroup, r: currentRow});
        // console.log(cellValue);
        if (!cellValue) continue; 

        const lesson : Lesson = {};
        lesson.name = cellValue.split(/\s+/).join(' ');
        const nOfLesson = Math.floor(i / 2);
        // console.log('nOfLesson', lesson.nOfLesson);

        lesson.type = getCellValue({c: sheduleBase.typeOfLesson, r: currentRow});
        lesson.classroom = getCellValue({c: sheduleBase.classroom, r: currentRow});

        if (i % 2 === 0) {
            day.odd.friday[nOfLesson] = lesson;
        }
        else {
            day.even.friday[nOfLesson] = lesson;
        }
    }
    writeFile('out/result.json', day);
    return day;
}
// неделя
//     четная
//         день
//             пары
//                 номер пары
//                 пара 
//                 время пары ?
//                 тип занятий
//                 аудитория
//     нечетная
//         день
//             пары
//                 номер пары
//                 пара
//                 время пары ?
//                 тип занятий
//                 аудитория

interface Lesson {
    // nOfLesson?: number,
    name?: string,
    type?: string,
    classroom?: string
}

interface CellAddress {
    c: number,
    r: number
}

// получить значение в ячейке, даже если ячейка смежная
function getCellValue(cellAddress: CellAddress) : string {
    const docMerges = workingSheet['!merges'];
    let cellValue = workingSheet[numberToCharAddress(cellAddress.c) + '' + (cellAddress.r + 1)];

    if (!!cellValue) {
        return (cellValue.v + '').trim();
    }
    else {
        // проверяем, является ли ячейка "частью" другой ячейки
        for (let merge of docMerges) {
            // если попадает в границы диапазона одного из !merges
            if ((cellAddress.c >= merge.s.c && cellAddress.c <= merge.e.c) &&
                (cellAddress.r >= merge.s.r && cellAddress.r <= merge.e.r)) 
            {
                // console.log('merges=',merge);
                // console.log(numberToCharAddress(merge.s.c) + '' + (merge.s.r + 1));
                cellValue = workingSheet[numberToCharAddress(merge.s.c) + '' + (merge.s.r + 1)]; 
            }
        }
        if (!cellValue) {
            return '';
        }
        else {
            return (cellValue.v + '').trim();
        }
    }
}

function numberToCharAddress(n) {
    var ACode = 'A'.charCodeAt(0);
    var ZCode = 'Z'.charCodeAt(0);
    var len = ZCode - ACode + 1;

    var charAddress = "";
    while (n >= 0) {
        charAddress = String.fromCharCode(n % len + ACode) + charAddress;
        n = Math.floor(n / len) - 1;
    }
    return charAddress;
}
// // Parse a file
// const workSheetsFromFile = xlsx_node.parse(`${__dirname}/${xlsFile}`);
// const jsonSheet = JSON.stringify(workSheetsFromFile[0]);


/*
найти столбец подгруппы
идти сверху вниз, проверяя на !merges
определить столбцы дня недели, столбца пар, времени, чет/нечет, тип занятий, аудитория

неделя
    четная
        день
            пары
                номер пары
                пара 
                время пары ?
                тип занятий
                аудитория

    нечетная
        день
            пары
                номер пары
                пара
                время пары ?
                тип занятий
                аудитория
*/

