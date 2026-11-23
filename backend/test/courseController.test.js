const test = require("node:test");
const assert = require("node:assert/strict");

const courseRoutes = require("../src/routes/courseRoutes");
const { addCourse } = require("../src/controllers/courseController");

test("Backend Course Module Unit & Route Tests", async (t) => {
    await t.test("courseRoutes defines POST / and GET / endpoints", () => {
        const routes = courseRoutes.stack
            .filter((layer) => layer.route)
            .map((layer) => ({
                path: layer.route.path,
                methods: Object.keys(layer.route.methods)
            }));

        const hasPost = routes.some((r) => r.path === "/" && r.methods.includes("post"));
        const hasGet = routes.some((r) => r.path === "/" && r.methods.includes("get"));

        assert.ok(hasPost, "Should have POST / route");
        assert.ok(hasGet, "Should have GET / route");
    });

    await t.test("addCourse validates missing courseCode and courseName", async () => {
        let statusCode = null;
        let responseJson = null;

        const req = {
            body: { courseCode: "", courseName: "Test Course", credits: 3 }
        };
        const res = {
            status: (code) => {
                statusCode = code;
                return {
                    json: (data) => {
                        responseJson = data;
                    }
                };
            }
        };

        await addCourse(req, res);
        assert.equal(statusCode, 400);
        assert.equal(responseJson.success, false);
        assert.match(responseJson.message, /required/i);
    });

    await t.test("addCourse validates invalid credits", async () => {
        let statusCode = null;
        let responseJson = null;

        const req = {
            body: { courseCode: "CS101", courseName: "Intro to CS", credits: "abc" }
        };
        const res = {
            status: (code) => {
                statusCode = code;
                return {
                    json: (data) => {
                        responseJson = data;
                    }
                };
            }
        };

        await addCourse(req, res);
        assert.equal(statusCode, 400);
        assert.equal(responseJson.success, false);
        assert.match(responseJson.message, /credits/i);
    });

    await t.test("addCourse validates negative credits", async () => {
        let statusCode = null;
        let responseJson = null;

        const req = {
            body: { courseCode: "CS101", courseName: "Intro to CS", credits: -2 }
        };
        const res = {
            status: (code) => {
                statusCode = code;
                return {
                    json: (data) => {
                        responseJson = data;
                    }
                };
            }
        };

        await addCourse(req, res);
        assert.equal(statusCode, 400);
        assert.equal(responseJson.success, false);
        assert.match(responseJson.message, /credits/i);
    });
});
