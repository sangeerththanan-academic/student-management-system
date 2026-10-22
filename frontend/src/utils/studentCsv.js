const CSV_FIELD_BY_HEADER = {
    registrationno: "registrationNo",
    registrationnumber: "registrationNo",
    firstname: "firstName",
    lastname: "lastName",
    email: "email",
    emailaddress: "email",
    phonenumber: "phoneNumber",
    phone: "phoneNumber",
    mobile: "phoneNumber",
    password: "password"
};

const REQUIRED_CSV_FIELDS = [
    "registrationNo",
    "firstName",
    "lastName",
    "email",
    "phoneNumber"
];

export const CSV_FIELD_LABELS = {
    registrationNo: "Registration Number",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    phoneNumber: "Phone Number"
};

const parseCsvRecords = (text) => {
    if (!text.trim()) {
        throw new Error("The CSV file is empty.");
    }

    const records = [];
    let record = [];
    let value = "";
    let inQuotes = false;
    let afterQuote = false;

    const finishField = () => {
        record.push(value);
        value = "";
        afterQuote = false;
    };

    const finishRecord = () => {
        finishField();
        records.push(record);
        record = [];
    };

    for (let index = 0; index < text.length; index += 1) {
        const character = text[index];

        if (inQuotes) {
            if (character === '"') {
                if (text[index + 1] === '"') {
                    value += '"';
                    index += 1;
                } else {
                    inQuotes = false;
                    afterQuote = true;
                }
            } else {
                value += character;
            }
            continue;
        }

        if (afterQuote) {
            if (character === ",") {
                finishField();
            } else if (character === "\n" || character === "\r") {
                finishRecord();
                if (character === "\r" && text[index + 1] === "\n") {
                    index += 1;
                }
            } else if (character !== " " && character !== "\t") {
                throw new Error("The CSV contains invalid characters after a quoted value.");
            }
            continue;
        }

        if (character === '"') {
            if (value.length !== 0) {
                throw new Error("The CSV contains a misplaced quote.");
            }
            inQuotes = true;
        } else if (character === ",") {
            finishField();
        } else if (character === "\n" || character === "\r") {
            finishRecord();
            if (character === "\r" && text[index + 1] === "\n") {
                index += 1;
            }
        } else {
            value += character;
        }
    }

    if (inQuotes) {
        throw new Error("The CSV contains an unclosed quoted value.");
    }

    if (value.length > 0 || record.length > 0 || afterQuote) {
        finishRecord();
    }

    return records.filter((row) => row.some((cell) => cell.trim() !== ""));
};

export const parseStudentCsv = (text) => {
    const records = parseCsvRecords(text);
    if (records.length < 2) {
        throw new Error("The CSV must include a header row and at least one student data row.");
    }

    const headers = records[0].map((header) => {
        const normalizedHeader = header
            .replace(/^\uFEFF/, "")
            .trim()
            .toLowerCase()
            .replace(/[\s_-]+/g, "");
        const field = CSV_FIELD_BY_HEADER[normalizedHeader];

        if (!field) {
            throw new Error(`Unsupported CSV column: "${header.trim()}".`);
        }
        return field;
    });

    if (new Set(headers).size !== headers.length) {
        throw new Error("The CSV contains duplicate columns for the same student field.");
    }

    const missingFields = REQUIRED_CSV_FIELDS.filter(
        (field) => !headers.includes(field)
    );
    if (missingFields.length > 0) {
        throw new Error(
            `Missing required CSV columns: ${missingFields
                .map((field) => CSV_FIELD_LABELS[field])
                .join(", ")}.`
        );
    }

    return records.slice(1).map((values, index) => {
        if (values.length !== headers.length) {
            throw new Error(
                `Student row ${index + 1} does not match the number of CSV columns.`
            );
        }

        const data = Object.fromEntries(
            headers.map((field, fieldIndex) => [
                field,
                field === "password"
                    ? values[fieldIndex]
                    : values[fieldIndex].trim()
            ])
        );
        const missingValues = REQUIRED_CSV_FIELDS.filter(
            (field) => !data[field]
        );
        if (missingValues.length > 0) {
            throw new Error(
                `Student row ${index + 1} is missing required information: ${missingValues
                    .map((field) => CSV_FIELD_LABELS[field])
                    .join(", ")}.`
            );
        }

        return { ...data, password: data.password || "" };
    });
};
