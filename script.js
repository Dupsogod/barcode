const months = {
    0: 'Января',
    1: 'Февраля',
    2: 'Марта',
    3: 'Апреля',
    4: 'Мая',
    5: 'Июня',
    6: 'Июля',
    7: 'Августа',
    8: 'Сентября',
    9: 'Октября',
    10: 'Ноября',
    11: 'Декабря'
}
const weekDays = {
    1: 'Понедельник',
    2: 'Вторник',
    3: 'Среда',
    4: 'Четверг',
    5: 'Пятница',
    6: 'Суббота',
    0: 'Воскресенье'
}
let offices = null
let kicVariant = 'select'
let inkVariant = 'select'
let allEmployees = null
let canvasBarcodeUrl = null
let officeIdentifier = null
let currencyId = null
let user = null
let userType = 'group'
let listRequestUri = `/Company/_api/web/lists/getByTitle('Список ДО и ККО')/items`
let requestHeaders = { "accept": "application/json;odata=verbose" }
let dataMatrixCanvas = null
let radioValue = 'package'
let denominationCounter = 0
let denominations = []
let deflatedBase64Line = ''
const cashRequestUrl = `/wfmbranch/_api/web/lists/getByTitle('Currency')/items`
const xsdString = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" attributeFormDefault="unqualified">
<xs:complexType name="invT">
<xs:annotation>
<xs:documentation>Опись содержимого сумки по номиналам (invT)</xs:documentation>
</xs:annotation>
<xs:sequence>
<xs:element name="no">
<xs:annotation>
<xs:documentation>Номинал (no)</xs:documentation>
</xs:annotation>
<xs:simpleType>
<xs:restriction base="xs:decimal">
<xs:fractionDigits value="2"/>
<xs:minExclusive value="0"/>
<xs:totalDigits value="100"/>
</xs:restriction>
</xs:simpleType>
</xs:element>
<xs:element name="qu">
<xs:annotation>
<xs:documentation>Количество (qu)</xs:documentation>
</xs:annotation>
<xs:simpleType>
<xs:restriction base="xs:integer">
<xs:minExclusive value="0"/>
<xs:totalDigits value="100"/>
</xs:restriction>
</xs:simpleType>
</xs:element>
<xs:element name="cc">
<xs:annotation>
<xs:documentation>Код валюты 810 = рубли (cc)</xs:documentation>
</xs:annotation>
<xs:simpleType>
<xs:restriction base="xs:string">
<xs:length value="3"/>
</xs:restriction>
</xs:simpleType>
</xs:element>
<xs:element name="ct">
<xs:annotation>
<xs:documentation>Тип валюты 01 = купюра(неповреждённая) 02 = монета (ct)</xs:documentation>
</xs:annotation>
<xs:simpleType>
<xs:restriction base="xs:string">
<xs:length value="2"/>
<xs:enumeration value="01"/>
<xs:enumeration value="02"/>
</xs:restriction>
</xs:simpleType>
</xs:element>
</xs:sequence>
</xs:complexType>
<xs:complexType name="bagT">
<xs:annotation>
<xs:documentation>Опись на сумку (bagT)</xs:documentation>
</xs:annotation>
<xs:sequence>
<xs:element name="do">
<xs:annotation>
<xs:documentation>Дата описи (do)</xs:documentation>
</xs:annotation>
<xs:simpleType>
<xs:restriction base="xs:string">
<xs:length value="10"/>
<xs:pattern value="[0-9]{4}-[0-1][0-9]-[0-3][0-9]"/>
</xs:restriction>
</xs:simpleType>
</xs:element>
<xs:element name="ink">
<xs:annotation>
<xs:documentation>ИНК клиента Уник идентификатор офиса КО присвоенный в СберБанке (ink)</xs:documentation>
</xs:annotation>
<xs:simpleType>
<xs:restriction base="xs:string">
<xs:maxLength value="50"/>
</xs:restriction>
</xs:simpleType>
</xs:element>
<xs:element name="packrN">
<xs:annotation>
<xs:documentation>ФИО сотрудника КО упаковавшего сейф-пакет (packrN)</xs:documentation>
</xs:annotation>
<xs:simpleType>
<xs:restriction base="xs:string">
<xs:maxLength value="250"/>
</xs:restriction>
</xs:simpleType>
</xs:element>
<xs:element name="nu">
<xs:annotation>
<xs:documentation>Номер сейф-пакета (nu)</xs:documentation>
</xs:annotation>
<xs:simpleType>
<xs:restriction base="xs:string">
<xs:maxLength value="100"/>
<xs:pattern value="[ A-Za-zА-Яа-яЁё0-9_\\\\.\\-/,]+"/>
</xs:restriction>
</xs:simpleType>
</xs:element>
<xs:element name="inv" type="invT" maxOccurs="unbounded">
<xs:annotation>
<xs:documentation>Опись содержимого сейф-пакета по валютам и номиналам (inv)</xs:documentation>
</xs:annotation>
</xs:element>
</xs:sequence>
</xs:complexType>
<xs:element name="bagS" type="bagT">
<xs:annotation>
<xs:documentation> Опись на сумку (bagS)</xs:documentation>
</xs:annotation>
</xs:element>
</xs:schema>`
$('#pointsDropdown').empty()


$('.datepicker-here').datepicker({
    onSelect: (dateFormatter, dateObj) => {
        let fullDateString = ''
        fullDateString += weekDays[dateObj.getDay()] + ' '
        fullDateString += dateObj.getDate() + ' '
        fullDateString += months[dateObj.getMonth()] + ' '
        fullDateString += dateObj.getFullYear() + ' '
        fullDateString += 'года'
        document.getElementById('date').innerHTML = fullDateString
        document.getElementById('printDate').innerHTML = fullDateString

        let dateCodeString = ''
        dateCodeString += dateFormatter.split('.')[2][2]
        dateCodeString += dateFormatter.split('.')[2][3]
        dateCodeString += dateFormatter.split('.')[1]
        dateCodeString += dateFormatter.split('.')[0]
        document.getElementById('dateCode').value = dateCodeString
        document.getElementById('dateCode').style.display = 'inline'

        if (document.getElementById('officeCode').value && document.getElementById('dateCode').value) {
            document.getElementById('successButton').style.display = 'inline'
        }
    }
})

$.ajax({
    url: listRequestUri,
    contentType: "application/json;odata=verbose",
    headers: requestHeaders
}).then(res => {
    offices = res.d.results
}, (error) => {
    console.log(error)
})

function searchOffice() {
    let value = document.getElementById('searchOfficeInput').value
    let officesList = document.querySelectorAll('#myDropdown > a')
    if (value.length < 3) {
        officesList.forEach(el => {
            el.style.display = ''
        })
        return
    }
    officesList.forEach(el => {
        if (el.innerHTML.toLowerCase().indexOf(value.toLowerCase()) === -1) {
            el.style.display = 'none'
        }
    })
}

function searchOfficeSecondTab() {
    let value = document.getElementById('searchOfficeInputSecondTab').value
    let officesList = document.querySelectorAll('#secondDropdown > a')
    if (value.length < 3) {
        officesList.forEach(el => {
            el.style.display = ''
        })
        return
    }
    officesList.forEach(el => {
        if (el.innerHTML.toLowerCase().indexOf(value.toLowerCase()) === -1) {
            el.style.display = 'none'
        }
    })
}

function formBarcode() {
    event.preventDefault()
    let summaryCode = document.getElementById('summaryCode')
    summaryCode.value = document.getElementById('officeCode').value + document.getElementById('dateCode').value
    summaryCode.style.display = 'inline'
    let canvas = document.createElement('canvas')
    bwipjs.toCanvas(canvas, {
        bcid: 'code128',
        text: summaryCode.value,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center'
    })
    canvasBarcodeUrl = canvas
    document.getElementById('barcodeImage').src = canvas.toDataURL('image/png')
    document.getElementById('barcodeImage').style.display = 'inline'
    document.getElementById('printBarcode').src = canvas.toDataURL('image/png')
    document.getElementById('printButton').style.display = 'inline'
    document.getElementById('fifthStepText1').style.color = 'lightgreen'
}

function printPage() {
    event.preventDefault()
    $('#printable').printThis()
}

// When the user clicks on the button, toggle between hiding and showing the dropdown content
function openDropdown() {
    event.preventDefault()
    document.getElementById("myDropdown").classList.toggle("show");
}

function openDropdownSecondTab() {
    event.preventDefault()
    document.getElementById("secondDropdown").classList.toggle("show");
}

// Close the dropdown menu if the user clicks outside of it
window.onclick = function (event) {
    if (!event.target.matches('.dropbtn') && !event.target.matches('input')) {
        let dropdowns = document.getElementsByClassName("dropdown-content");
        let i;
        for (i = 0; i < dropdowns.length; i++) {
            let openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}

setInterval(() => {
    if (document.getElementById('kicSberbank').innerHTML === '') {
        document.getElementById('firstStepText').style.color = 'red'
    } else {
        document.getElementById('firstStepText').style.color = 'lightgreen'
    }
    if (document.getElementById('secondTabDate').innerHTML === '') {
        document.getElementById('secondStepText').style.color = 'red'
    } else {
        document.getElementById('secondStepText').style.color = 'lightgreen'
    }
    if (document.getElementById('cashInput').value === '') {
        document.getElementById('thirdStepText').style.color = 'red'
    } else {
        document.getElementById('thirdStepText').style.color = 'lightgreen'
    }
    if (document.getElementById('sealOne').value === '') {
        document.getElementById('fourthStepText').style.color = 'red'
    } else {
        document.getElementById('fourthStepText').style.color = 'lightgreen'
    }
    if (document.getElementById('sealTwo').value === '') {
        document.getElementById('fifthStepText').style.color = 'red'
    } else {
        document.getElementById('fifthStepText').style.color = 'lightgreen'
    }
    for (let i = 0; i <= denominationCounter; i += 1) {
        if (document.getElementById(`denominationCount${i}`).value === '') {
            document.getElementById(`sixthStepText${i}`).style.color = 'red'
        } else {
            document.getElementById(`sixthStepText${i}`).style.color = 'lightgreen'
        }
    }

    if (document.getElementById('office').innerHTML === '') {
        document.getElementById('firstStepText1').style.color = 'red'
        document.getElementById('thirdStepText1').style.color = 'red'
    } else {
        document.getElementById('firstStepText1').style.color = 'lightgreen'
        document.getElementById('thirdStepText1').style.color = 'lightgreen'
    }
    if (document.getElementById('date').innerHTML === '') {
        document.getElementById('secondStepText1').style.color = 'red'
        document.getElementById('fourthStepText1').style.color = 'red'
    } else {
        document.getElementById('secondStepText1').style.color = 'lightgreen'
        document.getElementById('fourthStepText1').style.color = 'lightgreen'
    }
}, 10)

let changeTab = (first, second) => {
    $(`#${first}`).removeClass('d-none')
    $(`#${second}`).addClass('d-none')
    if (first === 'firstTab') {
        document.getElementById('documentHeader').style.color = '#3498DB'
        document.getElementById('documentHeader2').style.color = 'black'
    } else {
        document.getElementById('documentHeader2').style.color = '#3498DB'
        document.getElementById('documentHeader').style.color = 'black'
    }
}

function formDataMatrix(base64Text) {
    let canvas = document.createElement('canvas')
    bwipjs.toCanvas(canvas, {
        bcid: 'qrcode',
        text: base64Text,
        scale: 3,
        height: 40,
        width: 40,
        includetext: true,
        textxalign: 'center'
    })
    dataMatrixCanvas = canvas
    document.getElementById('dataMatrixImage').src = canvas.toDataURL('image/png')
    document.getElementById('dataMatrixImage').classList.remove('d-none')
}

function checkXML(xsdStr, xmlStr) {
    return new Promise((resolve, reject) => {

        let request = new XMLHttpRequest()

        let urlRequest = "/UsefulServices/_vti_bin/rc.sp.usefulservices/main.svc/CheckXML"

        request.open("POST", urlRequest)
        request.setRequestHeader('Content-type', 'application/json; charset=utf-8')
        request.setRequestHeader("accept", "application/json;odata=verbose")

        request.onreadystatechange = function () {

            if (request.readyState == 4) {
                if (request.status == 200) {
                    var item = JSON.parse(request.responseText)
                    resolve(item)
                } else {
                    reject("Error check xml")
                }

            }
        }

        var itemData = {
            Xsd: xsdStr,
            Xml: xmlStr
        }

        request.send(JSON.stringify(itemData))
    })
}

function getPdf(id) {
    $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + '/_vti_bin/RC.SP.CashCollection/CashColl.svc/MakePdfWithBlanks?id=' + id,
        contentType: 'application/json;odata=verbose',
        headers: {
            'accept': 'application/json;odata=verbose',
            'X-RequestDigest': $('#__REQUESTDIGEST').val(),
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
    }).then((data) => {
        let val = data

        // response from API
        if (val && val.success && val.pdfFiles.length > 0) {
            for (let j = 0; j < val.pdfFiles.length; j++) {
                let binaryString = window.atob(val.pdfFiles[j].Value)
                let byteNumbers = new Array(binaryString.length)
                for (let i = 0; i < binaryString.length; i++) {
                    byteNumbers[i] = binaryString.charCodeAt(i)
                }
                let byteArray = new Uint8Array(byteNumbers)

                let blob = new Blob([byteArray])
                let fileName = val.pdfFiles[j].Key + ".pdf"

                if (navigator.msSaveBlob) { // IE 10+
                    navigator.msSaveBlob(blob, fileName)
                } else {
                    let link = document.createElement("a")

                    if (link.download !== undefined) {
                        // Browsers that support HTML5 download attribute
                        let url = URL.createObjectURL(blob)

                        link.setAttribute("href", url)
                        link.setAttribute("download", fileName)
                        link.style.visibility = 'hidden'
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                    }
                }
            }
        } else {
            alert('Произошла ошибка при загрузке файла')
        };
    }, function (error) {
        console.log(JSON.stringify(error))
    })
}


function changeRadioValue(value) {
    radioValue = value
    if (value === 'bag') {
        $('#bagBlock').addClass('d-none')
        document.getElementById('cashInput').value = '0'
        $('#sealBlock').removeClass('d-none')
    } else {
        $('#sealBlock').addClass('d-none')
        $('#bagBlock').removeClass('d-none')
        document.getElementById('sealOne').value = ''
        document.getElementById('sealTwo').value = ''
    }
}

function translit(word) {
    let answer = ''
    let converter = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
        'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i',
        'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
        'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
        'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch',
        'ш': 'sh', 'щ': 'sch', 'ь': '', 'ы': 'y', 'ъ': '',
        'э': 'e', 'ю': 'yu', 'я': 'ya',

        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D',
        'Е': 'E', 'Ё': 'E', 'Ж': 'Zh', 'З': 'Z', 'И': 'I',
        'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
        'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T',
        'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'C', 'Ч': 'Ch',
        'Ш': 'Sh', 'Щ': 'Sch', 'Ь': '', 'Ы': 'Y', 'Ъ': '',
        'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
    }

    for (let i = 0; i < word.length; ++i) {
        if (converter[word[i]] === undefined) {
            answer += word[i];
        } else {
            answer += converter[word[i]]
        }
    }

    return answer
}

function send(variant) {
    event.preventDefault()
    confirmBagNumber(+document.getElementById('cashInput').value).then(confirmation => {
        let isValidNumber = null
        if (confirmation.d.results.length && document.getElementById('radioOne').checked) {
            isValidNumber = confirm('Такой номер сейф-пакета уже был сгенерирован. Вы уверены что хотите повторно сгенерировать бланк?')
        } else {
            isValidNumber = true
        }
        if (isValidNumber) {
            let kic = kicVariant === 'select' ? document.getElementById('kicSberbank').innerHTML : document.getElementById('kicInput').value
            let ink = inkVariant === 'select' ? document.getElementById('ink').innerHTML : document.getElementById('inkInput').value
            let denominationXMLTemplate = ''
            let currencyType = ''
            if (document.getElementById('cashCode').value === 810) {
                currencyType = '02'
            } else {
                currencyType = '01'
            }
            for (let i = 0; i <= denominationCounter; i += 1) {
                let temp = `<inv>
                <no>${document.getElementById('denomination' + String(i)).value}</no>
                <qu>${document.getElementById('denominationCount' + String(i)).value}</qu>
                <cc>${document.getElementById('cashCode').value}</cc>
                <ct>${currencyType}</ct>
            </inv>
            `
                denominationXMLTemplate += temp
            }
            let templateXML = `<?xml version="1.0" encoding="UTF-8"?>
        <bagS>
            <do>${document.getElementById('secondTabDate').innerHTML.split('.').reverse().join('-')}</do>
            <ink>${ink}</ink>
            <packrN>${userType === 'group' ? document.getElementById('employeesSelect').value.replace(',', '') : document.getElementById('searchedEmployee').innerHTML}</packrN>
            <nu>${document.getElementById('cashInput').value}</nu>
            ${denominationXMLTemplate}
        </bagS>`
            checkXML(xsdString, templateXML).then((flagCheck) => {
                console.log('Результат проверки xml валидатором - ', flagCheck)
                flagCheck = true
                if (flagCheck === true) {
                    try {
                        getDealatedBase64Line(templateXML).then((base64Line) => {
                            formDataMatrix(base64Line)
                            let bagType = 'Инкассаторская сумка'
                            if (document.getElementById('radioOne').checked) {
                                bagType = 'Сейф-пакет'
                            }
                            if (variant === 2) {
                                let tempDate = (new Date(document.getElementById('secondTabDate').innerHTML.split('.').reverse().join('-') + 'T00:00:00')).toUTCString();
                                let printableXML = formPrintableXML(base64Line)
                                getPdfPrintForm(printableXML)
                                $.ajax({
                                    url: `/wfmbranch/_api/web/lists/getByTitle('barcodeGenerations')/items`,
                                    type: 'POST',
                                    headers: {
                                        "accept": 'application/json;odata=verbose',
                                        "Content-Type": 'application/json;odata=verbose',
                                        "X-RequestDigest": document.querySelector("#__REQUESTDIGEST").value
                                    },
                                    data: JSON.stringify({
                                        "__metadata": { "type": "SP.Data.BarcodeGenerationsListItem" },
                                        Title: 'Смотреть',
                                        KKOId: +officeIdentifier,
                                        CurrentDate: tempDate,
                                        CashInBag1: String(document.getElementById('cashInput').value),
                                        BagType: bagType,
                                        SealOne: String(document.getElementById('sealOne').value),
                                        SealTwo: String(document.getElementById('sealTwo').value),
                                        XmlData: String(templateXML),
                                        Base64Data: base64Line,
                                        Base64Image: String(document.getElementById('dataMatrixImage').src),
                                        CurrencyJSON: formCurrencyJSON(),
                                        SbKicSpec: kic,
                                        SbInkSpec: ink,
                                        UserSpec: userType === 'group' ? document.getElementById('employeesSelect').value.replace(',', '') : document.getElementById('searchedEmployee').innerHTML
                                    })
                                }).then(() => {
                                }, error => {
                                    console.log(error)
                                })
                            }
                            else if (variant === 1) {
                                let tempDate = (new Date(document.getElementById('secondTabDate').innerHTML.split('.').reverse().join('-') + 'T00:00:00')).toUTCString();
                                $.ajax({
                                    url: `/wfmbranch/_api/web/lists/GetByTitle('BarcodeGenerations')/items`,
                                    type: 'POST',
                                    headers: {
                                        "accept": 'application/json;odata=verbose',
                                        "Content-Type": 'application/json;odata=verbose',
                                        "X-RequestDigest": document.querySelector("#__REQUESTDIGEST").value
                                    },
                                    data: JSON.stringify({
                                        __metadata: { "type": "SP.Data.BarcodeGenerationsListItem" },
                                        Title: 'Смотреть',
                                        KKOId: +officeIdentifier,
                                        CurrentDate: tempDate,
                                        CashInBag1: String(document.getElementById('cashInput').value),
                                        BagType: bagType,
                                        SealOne: String(document.getElementById('sealOne').value),
                                        SealTwo: String(document.getElementById('sealTwo').value),
                                        XmlData: String(templateXML),
                                        Base64Data: base64Line,
                                        Base64Image: String(document.getElementById('dataMatrixImage').src),
                                        CurrencyJSON: formCurrencyJSON(),
                                        SbKicSpec: kic,
                                        SbInkSpec: ink,
                                        UserSpec: userType === 'group' ? document.getElementById('employeesSelect').value.replace(',', '') : document.getElementById('searchedEmployee').innerHTML
                                    })
                                }).then((response) => {
                                    getPdf(String(response.d.Id))
                                    alert('Запись сохранена')
                                }, (error) => {
                                    console.log(error)
                                    alert('Произошла ошибка при отправке записи')
                                })
                            }
                        })
                    } catch (error) {
                        console.log(error)
                        alert('Ошибка в формате данных')
                    }
                } else {
                    alert('Ошибка в формате данных')
                }
            }, (message) => {
                console.log(message)
            })
        }
    })
}

function changeEmployeesSearch(option) {
    event.preventDefault()
    switch (option) {
        case 1: {
            $('#allEmployeesBlock').removeClass('d-none')
            $('#groupEmployeesBlock').addClass('d-none')
            userType = 'all'
            break
        }
        case 2: {
            $('#groupEmployeesBlock').removeClass('d-none')
            $('#allEmployeesBlock').addClass('d-none')
            userType = 'group'
            break
        }
    }
}

function getDealatedBase64Line(xmlString) {
    return $.ajax({
        url: '/UsefulServices/_vti_bin/RC.SP.UsefulServices/main.svc/encodestring',
        type: 'POST',
        headers: { 'Content-type': 'application/json; charset=utf-8' },
        data: JSON.stringify(xmlString)
    })
}

function getPdfPrintForm(xmlStr) {
    let xhr = new XMLHttpRequest()

    xhr.responseType = 'blob'

    xhr.onload = function () {
        let a = document.createElement('a')
        a.href = window.URL.createObjectURL(xhr.response)
        a.download = "blank.pdf"
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        a.remove()
    }

    xhr.open('POST', "/usefulservices/_vti_bin/RC.SP.UsefulServices/main.svc/getprintforms")
    xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8')

    //Prod
    var itemData = {
        XmlString: xmlStr,
        UrlService: 'https://apic-prod.rccf.ru/rencredit/prod/print_forms/v2/print_form?printFormFormat=pdf&printFormAbsolutePath=/RCCF_CREDIT_REPORTS/Inventory/Inventory.xdo&printFormTemplate=Inventory',
        ClientId: '925f0db8-3012-481d-aa23-57f060e2de25',
        ClientUpd: 'K8kC5lX0tP6mG6qX7yS8eL7yM4dK5kD1kJ4kM5kC1uT1yQ7lP1'
    }

    //Test
    // var itemData = {
    //     XmlString: xmlStr,
    //     UrlService: 'https://srvap1307.rccf.ru/rencredit/test/print_forms/v2/print_form?printFormFormat=pdf&printFormAbsolutePath=/RCCF_CREDIT_REPORTS/Inventory/Inventory.xdo&printFormTemplate=Inventory',
    //     ClientId: '5c75873f-d4b0-4c21-a320-02dc8fa74d15',
    //     ClientUpd: 'oG1rM0mL5xQ2cJ3bL1eY7bR7sK0uC7kS4cR3kO7qO0jR5qP8nW'
    // }

    xhr.send(JSON.stringify(itemData))
}

function formPrintableXML(base64String) {
    let currencyDataTemplate = ''
    for (let i = 0; i <= denominationCounter; i += 1) {
        let temp = `<currency>
                <currencyName>${document.getElementById('selectCurrency').value}</currencyName>
                <currencyCode>${document.getElementById('cashCode').value}</currencyCode>
                <currencyDenomination>${document.getElementById('denomination' + String(i)).value}</currencyDenomination>
                <currencySum>${document.getElementById('denominationSum' + String(i)).value}</currencySum>
            </currency>
            `
        currencyDataTemplate += temp
    }

    let template = `<?xml version='1.0' encoding='UTF-8'?>
        <fullData>
            <inventoryData>
                <inventoryDate>${document.getElementById('secondTabDate').innerHTML.split('.').join('-')}</inventoryDate>
                <senderBankName>${document.getElementById('officeSecondTab').innerHTML}</senderBankName>
                <receiveBankName>${kicVariant === 'select' ? document.getElementById('kicSberbank').innerHTML : document.getElementById('kicInput').value}</receiveBankName>
                <bagNumber>${document.getElementById('cashInput').value}</bagNumber>
                <firstSealNumber>${document.getElementById('sealOne').value}</firstSealNumber>
                <secondSealNumber>${document.getElementById('sealTwo').value}</secondSealNumber>
                <currencyData>
                    ${currencyDataTemplate}
                </currencyData>
                <currencyTotalAmount>${document.getElementById('sum').value}</currencyTotalAmount>
                <cashierName>${userType === 'group' ? document.getElementById('employeesSelect').value : document.getElementById('searchedEmployee').innerHTML}</cashierName>
            </inventoryData>
            <barCodeData>${base64String}</barCodeData>
        </fullData>
        `

    return template
}

function formCurrencyJSON() {
    let result = []
    for (let i = 0; i <= denominationCounter; i += 1) {
        let temp = {
            currencyTypeId: currencyId,
            denomination: document.getElementById(`denomination${i}`).value,
            countDenomination: document.getElementById(`denominationCount${i}`).value,
            summDenomination: document.getElementById(`denominationSum${i}`).value,
            totalSumm: document.getElementById('sum').value
        }
        result.push(temp)
    }
    //console.log(JSON.stringify(result))
    return JSON.stringify(result)
}

function confirmBagNumber(num) {
    return $.ajax({
        url: `/wfmbranch/_api/web/lists/getByTitle('barcodeGenerations')/items?$filter=(CashInBag1 eq ${num})`,
        contentType: 'application/json;odata=verbose',
        headers: requestHeaders
    })
}

function calculateSum(e) {
    const number = e.target.id.replace(/\D+/g, "")
    const first = document.getElementById(`denomination${number}`).value
    let second = document.getElementById(`denominationCount${number}`).value
    if (Math.round(second) !== 0) {
        second = Math.round(second)
        document.getElementById(`denominationCount${number}`).value = second
    }
    if (second < 0) {
        second *= -1
        document.getElementById(`denominationCount${number}`).value = second
    }
    document.getElementById(`denominationSum${number}`).value = +(+first * +second).toFixed(2)
    let resultSum = 0
    for (let i = 0; i <= denominationCounter; i += 1) {
        resultSum += +document.getElementById(`denominationSum${i}`).value
    }
    document.getElementById('sum').value = +resultSum.toFixed(2)
}

function addDenomination(event) {
    event.preventDefault()
    denominationCounter += 1
    let container = $('#denominationContainer')
    let template = `
                <div id="denominationBlock${denominationCounter}" class="form-group row w-75">
                    <div class="col-4"></div>
                    <div class="col-3">
                        <label class="adaptive-height">Номинал:</label>
                        <select onchange="calculateSum(event)" class="form-control" id="denomination${denominationCounter}" />
                    </div>
                    <div class="col-2">
                        <label id="sixthStepText${denominationCounter}" class="adaptive-height">Количество по номиналу:</label>
                        <input oninput="calculateSum(event)" type="number" class="form-control" id="denominationCount${denominationCounter}"/>
                    </div>
                    <div class="col-3">
                        <label class="adaptive-height">Сумма по номиналу:</label>
                        <input disabled type="number" class="form-control" id="denominationSum${denominationCounter}"/>
                    </div>
                </div>`
    container.append(template)
    let currentDenomination = document.getElementById('selectCurrency').value
    denominations.forEach(el => {
        if (el.name === currentDenomination) {
            let tempArray = el.value.split(';')
            tempArray.forEach(den => {
                let node = document.createElement('option')
                node.innerHTML = String(den)
                document.getElementById(`denomination${denominationCounter}`).appendChild(node)
            })
        }
    })
}

function removeDenomination() {
    if (denominationCounter === 0) {
        return
    }
    document.getElementById(`denominationBlock${denominationCounter}`).remove()
    denominationCounter -= 1
    let newSum = 0
    for (let i = 0; i <= denominationCounter; i += 1) {
        newSum += +document.getElementById('denominationSum' + i).value
    }
    document.getElementById('sum').value = newSum
}

$('.datepicker-here-second').datepicker({
    onSelect: (dateFormatter, dateObj) => {
        document.getElementById('secondTabDate').innerHTML = dateFormatter
    }
})

$.ajax({
    url: listRequestUri,
    contentType: "application/json;odata=verbose",
    headers: requestHeaders
}).then(res => {
    offices = res.d.results
}, (error) => {
    console.log(error)
})

$.ajax({
    url: `/wfmbranch/_api/web/lists/getByTitle('Users')/items?$top=10000`,
    contentType: "application/json;odata=verbose",
    headers: requestHeaders
}).then(res => {
    allEmployees = res.d.results
}, error => {
    console.log('Ошибка в загрузке всех сотрудников', error)
})

let filterEmployees = () => {
    let dropdown = document.getElementById('allEmployeesDropdown')
    let input = document.getElementById('allEmployeesInput')
    dropdown.innerHTML = ''
    let value = input.value
    dropdown.classList.remove('d-none')
    if (value.length < 3) {
        if (value.length === 0) {
            dropdown.classList.add('d-none')
        } else {
            let text = document.createElement('a')
            text.innerHTML = 'Введите как минимум 3 символа'
            dropdown.appendChild(text)
        }
    } else {
        allEmployees.forEach(employee => {
            if (employee.FIO.toLowerCase().indexOf(value.toLowerCase()) !== -1) {
                let newNode = document.createElement('p')
                newNode.innerHTML = employee.FIO
                newNode.classList.add('drop-itm', 'pointer')
                newNode.onclick = (event) => {
                    document.getElementById('searchedEmployee').innerHTML = event.target.innerHTML
                    input.value = employee.FIO
                }
                dropdown.appendChild(newNode)
            }
        })
        if (!dropdown.hasChildNodes()) {
            let text = document.createElement('a')
            text.innerHTML = 'Ничего не найдено'
            dropdown.appendChild(text)
        }
    }
}

let editInfo = (num) => {
    switch (num) {
        case 1: {
            $('#kicSberbank').addClass('d-none')
            $('#kicInput').removeClass('d-none')
            $('#edit1').addClass('d-none')
            $('#close1').removeClass('d-none')
            kicVariant = 'write'
            break
        }
        case 2: {
            $('#ink').addClass('d-none')
            $('#inkInput').removeClass('d-none')
            $('#edit2').addClass('d-none')
            $('#close2').removeClass('d-none')
            inkVariant = 'write'
            break
        }
        case 3: {
            $('#kicSberbank').removeClass('d-none')
            $('#kicInput').addClass('d-none')
            $('#edit1').removeClass('d-none')
            $('#close1').addClass('d-none')
            kicVariant = 'select'
            break
        }
        case 4: {
            $('#ink').removeClass('d-none')
            $('#inkInput').addClass('d-none')
            $('#edit2').removeClass('d-none')
            $('#close2').addClass('d-none')
            inkVariant = 'select'
            break
        }
    }
}

let filterPoints = (tag) => {
    let dropdown = null
    let input = null
    if (tag === undefined) {
        dropdown = document.getElementById('pointsDropdown')
        input = document.getElementById('pointsInput')
    } else {
        dropdown = document.getElementById('pointsDropdown1')
        input = document.getElementById('pointsInput1')
    }
    dropdown.innerHTML = ''
    let value = input.value
    dropdown.classList.remove('d-none')
    if (value.length < 3) {
        if (value.length === 0) {
            dropdown.classList.add('d-none')
        } else {
            let text = document.createElement('a')
            text.innerHTML = 'Введите как минимум 3 символа'
            dropdown.appendChild(text)
        }
    } else {
        offices.forEach(office => {
            if (office.Title.toLowerCase().indexOf(value.toLowerCase()) !== -1) {
                let newNode = document.createElement('p')
                newNode.innerHTML = office.Title
                newNode.code = office.CD
                newNode.kic = office.OData__x041a__x0418__x0426__x0020__x04
                newNode.ink = office.INK
                newNode.identifier = office.Id
                newNode.classList.add('drop-itm', 'pointer')
                newNode.onclick = (event) => {
                    if (tag === undefined) {
                        document.getElementById('officeSecondTab').innerHTML = event.target.innerHTML
                        document.getElementById('kicSberbank').innerHTML = event.target.kic
                        document.getElementById('ink').innerHTML = event.target.ink
                        officeIdentifier = event.target.identifier
                        document.querySelectorAll('.edit-wrapper').forEach(el => {
                            el.classList.remove('d-none')
                        })
                        $('#employeesSelect').empty()
                        $.ajax({
                            url: `/wfmbranch/_api/web/lists/getByTitle('Users')/items?$filter=substringof('${document.getElementById("officeSecondTab").innerHTML.split('"')[1]}', Departament)`,
                            contentType: 'application/json;odata=verbose',
                            headers: requestHeaders
                        }).then(res => {
                            res.d.results.forEach(el => {
                                let temp = `<option>${el.FIO}</option>`
                                $('#employeesSelect').append(temp)
                            })
                        })
                    } else {
                        document.getElementById('office').innerHTML = event.target.innerHTML
                        document.getElementById('officeCode').value = event.target.code
                        document.getElementById('officeCode').style.display = 'inline'
                        document.getElementById('printOffice').innerHTML = event.target.innerHTML
                        if (document.getElementById('officeCode').value && document.getElementById('dateCode').value) {
                            document.getElementById('successButton').style.display = 'inline'
                        }
                    }
                    input.value = office.Title
                }
                dropdown.appendChild(newNode)
            }
        })
        if (!dropdown.hasChildNodes()) {
            let text = document.createElement('a')
            text.innerHTML = 'Ничего не найдено'
            dropdown.appendChild(text)
        }
    }
}

window.onclick = () => {
    if (!event.target.matches('#pointsInput') && !event.target.matches('#pointsDropdown')) {
        document.getElementById('pointsDropdown').classList.add('d-none')
    }
    if (!event.target.matches('#pointsInput1') && !event.target.matches('#pointsDropdown1')) {
        document.getElementById('pointsDropdown1').classList.add('d-none')
    }
    if (!event.target.matches('#allEmployeesInput') && !event.target.matches('#allEmployeesDropdown')) {
        document.getElementById('allEmployeesDropdown').classList.add('d-none')
    }
}

$.ajax({
    url: cashRequestUrl,
    contentType: "application/json;odata=verbose",
    headers: requestHeaders
}).then(data => {
    data.d.results.forEach((el, ind) => {
        if (ind === 0) {
            document.getElementById('cashCode').value = el.Code
            currencyId = el.Id
            let denominationArray = el.Denomination.split(';')
            denominationArray.forEach(den => {
                let temp = document.createElement('option')
                temp.innerHTML = String(den)
                document.getElementById('denomination0').appendChild(temp)
            })
        }
        let tempDenominationElement = { name: el.Title, value: el.Denomination }
        denominations.push(tempDenominationElement)
        let node = document.createElement('option')
        node.innerHTML = el.Title
        node.code = el.Code
        node.identifier = el.Id
        node.denomination = el.Denomination
        document.getElementById('selectCurrency').appendChild(node)
    })
    document.getElementById('selectCurrency').onchange = (event) => {
        Array.from(event.target.options).forEach(option => {
            if (option.selected) {
                document.getElementById('cashCode').value = option.code
                currencyId = option.identifier
                for (let i = 0; i <= denominationCounter; i += 1) {
                    document.getElementById(`denominationCount${i}`).value = 0
                    document.getElementById(`denominationSum${i}`).value = 0
                    document.getElementById(`sum`).value = 0
                    let target = document.getElementById(`denomination${i}`)
                    target.innerHTML = ''
                    let tempArray = option.denomination.split(';')
                    tempArray.forEach(den => {
                        let node = document.createElement('option')
                        node.innerHTML = String(den)
                        target.appendChild(node)
                    })
                }
                while (denominationCounter > 0) {
                    removeDenomination()
                }
            }
        })
    }
}, (error) => {
    console.log(error)
})