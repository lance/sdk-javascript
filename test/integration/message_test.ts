import { expect } from "chai";
import { CloudEvent, CONSTANTS, Version } from "../../src";
import { CloudEventV03, CloudEventV1 } from "../../src/event/interfaces";
import { Message, HTTP } from "../../src/messages";

const type = "org.cncf.cloudevents.example";
const source = "urn:event:from:myapi/resource/123";
const contentType = "application/cloudevents+json; charset=utf-8";
const time = new Date();
const subject = "subject.ext";
const dataschema = "http://cloudevents.io/schema.json";
const datacontenttype = "application/json";
const id = "b46cf653-d48a-4b90-8dfa-355c01061361";
const data = {
  foo: "bar",
};

const ext1Name = "extension1";
const ext1Value = "foobar";
const ext2Name = "extension2";
const ext2Value = "acme";

const fixture: CloudEvent = new CloudEvent({
  specversion: Version.V1,
  id,
  type,
  source,
  datacontenttype,
  subject,
  time,
  dataschema,
  data,
  [ext1Name]: ext1Value,
  [ext2Name]: ext2Value,
});

describe("HTTP", () => {
  it("provides V1 binary messages", () => {
    const message: Message = HTTP.binary(fixture);
    expect(message.body).to.equal(data);
    // validate all headers
    expect(message.headers[CONSTANTS.HEADER_CONTENT_TYPE]).to.equal(datacontenttype);
    expect(message.headers[CONSTANTS.CE_HEADERS.SPEC_VERSION]).to.equal(Version.V1);
    expect(message.headers[CONSTANTS.CE_HEADERS.ID]).to.equal(id);
    expect(message.headers[CONSTANTS.CE_HEADERS.TYPE]).to.equal(type);
    expect(message.headers[CONSTANTS.CE_HEADERS.SOURCE]).to.equal(source);
    expect(message.headers[CONSTANTS.CE_HEADERS.SUBJECT]).to.equal(subject);
    expect(message.headers[CONSTANTS.CE_HEADERS.TIME]).to.equal(fixture.time);
    expect(message.headers[CONSTANTS.BINARY_HEADERS_1.DATA_SCHEMA]).to.equal(dataschema);
  });
});
