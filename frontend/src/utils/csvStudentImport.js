import Papa from "papaparse";

const REQUIRED_COLUMNS = [
    "registrationNo",
    "firstName",
    "lastName",
    "email",
    "phoneNumber",
];

const HEADER_ALIASES = {
    registrationno: "registrationNo",
    registration_no: "registrationNo",
    registrationnumber: "registrationNo",
    registration_number: "registrationNo",

    firstname: "firstName",
    first_name: "firstName",

    lastname: "lastName",
    last_name: "lastName",

    email: "email",

    phone: "phoneNumber",
    phonenumber: "phoneNumber",
    phone_number: "phoneNumber",

    password: "password",
};

const normalizeHeader = (header) =>
    header
        .trim()
        .replace(/^\uFEFF/, "")
        .replace(/[\s-]+/g, "")
        .toLowerCase();

export function parseStudentCSV(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error("Please select a CSV file."));
            return;
        }

        if (!file.name.toLowerCase().endsWith(".csv")) {
            reject(new Error("Please select a valid CSV file."));
            return;
        }

        if (file.size === 0) {
            reject(new Error("The selected CSV file is empty."));
            return;
        }

        Papa.parse(file, {
            header: true,
            skipEmptyLines: "greedy",
            transformHeader: (header) => header.trim(),

            complete: (results) => {
                try {
                    if (results.errors.length > 0) {
                        throw new Error(
                            "The CSV file contains formatting errors. Please check the file."
                        );
                    }

                    const headers = results.meta.fields || [];

                    if (headers.length === 0) {
                        throw new Error(
                            "The CSV file must contain column headers."
                        );
                    }

                    const mappedHeaders = {};

                    for (const header of headers) {
                        const normalized = normalizeHeader(header);
                        const field = HEADER_ALIASES[normalized];

                        if (!field) continue;

                        if (mappedHeaders[field]) {
                            throw new Error(
                                `Duplicate CSV columns found for ${field}.`
                            );
                        }

                        mappedHeaders[field] = header;
                    }

                    const missingColumns = REQUIRED_COLUMNS.filter(
                        (field) => !mappedHeaders[field]
                    );

                    if (missingColumns.length > 0) {
                        throw new Error(
                            `Missing required columns: ${missingColumns.join(", ")}.`
                        );
                    }

                    const rows = results.data.filter((row) =>
                        Object.values(row).some(
                            (value) => String(value ?? "").trim() !== ""
                        )
                    );

                    if (rows.length === 0) {
                        throw new Error(
                            "The CSV file contains no student records."
                        );
                    }

                    const students = rows.map((row, index) => {
                        const student = {
                            registrationNo: "",
                            firstName: "",
                            lastName: "",
                            email: "",
                            phoneNumber: "",
                            password: "",
                        };

                        for (const field of Object.keys(student)) {
                            const header = mappedHeaders[field];

                            if (header) {
                                student[field] = String(
                                    row[header] ?? ""
                                ).trim();
                            }
                        }

                        const missingValues = REQUIRED_COLUMNS.filter(
                            (field) => !student[field]
                        );

                        return {
                            ...student,
                            csvRowNumber: index + 2,
                            missingValues,
                        };
                    });

                    resolve(students);
                } catch (error) {
                    reject(error);
                }
            },

            error: () => {
                reject(
                    new Error(
                        "Unable to read the CSV file. Please try again."
                    )
                );
            },
        });
    });
}
