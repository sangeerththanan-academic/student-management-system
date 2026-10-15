import assert from "node:assert/strict";
import test from "node:test";
import { parseStudentCsv } from "../src/utils/studentCsv.js";

test("maps multiple CSV rows and supported header aliases", () => {
    const students = parseStudentCsv(
        "\uFEFFRegistration Number,First Name,Last Name,Email,Phone Number,Password\r\n" +
        "STU001,Alex,Stone,alex@example.com,1234567890,Secure1!\r\n" +
        "STU002,Jamie,Lee,jamie@example.com,0987654321,Secure2!"
    );

    assert.equal(students.length, 2);
    assert.deepEqual(students[0], {
        registrationNo: "STU001",
        firstName: "Alex",
        lastName: "Stone",
        email: "alex@example.com",
        phoneNumber: "1234567890",
        password: "Secure1!"
    });
    assert.equal(students[1].registrationNo, "STU002");
});

test("parses quoted commas, escaped quotes, and optional password", () => {
    const [student] = parseStudentCsv(
        "registration_no,first_name,last_name,email,phone,password\n" +
        'STU003,Alex,"Lee, Jr.",alex@example.com,1234567890,"Secure ""1!"""\n'
    );

    assert.equal(student.lastName, "Lee, Jr.");
    assert.equal(student.password, 'Secure "1!"');
});

test("leaves an omitted password blank for manual entry", () => {
    const [student] = parseStudentCsv(
        "registrationNo,firstName,lastName,email,phoneNumber\n" +
        "STU004,Casey,Reed,casey@example.com,1234567890"
    );

    assert.equal(student.password, "");
});

test("rejects empty, malformed, missing-column, and invalid-row CSV data", () => {
    assert.throws(() => parseStudentCsv(" \r\n"), /empty/i);
    assert.throws(
        () => parseStudentCsv("registrationNo,firstName\nSTU001,Alex"),
        /Missing required CSV columns/
    );
    assert.throws(
        () => parseStudentCsv(
            "registrationNo,firstName,lastName,email,phoneNumber\n" +
            'STU001,"Alex,Stone,alex@example.com,1234567890'
        ),
        /unclosed quoted value/
    );
    assert.throws(
        () => parseStudentCsv(
            "registrationNo,firstName,lastName,email,phoneNumber\n" +
            "STU001,Alex,Stone,alex@example.com"
        ),
        /does not match/
    );
    assert.throws(
        () => parseStudentCsv(
            "registrationNo,firstName,lastName,email,phoneNumber\n" +
            "STU001,,Stone,alex@example.com,1234567890"
        ),
        /missing required information/
    );
});
