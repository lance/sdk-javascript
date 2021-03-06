const expect = require("chai").expect;
const { CloudEvent } = require("../index.js");
const { v4: uuidv4 } = require("uuid");
const { asBase64 } = require("../lib/bindings/http/validation/fun.js");
const ValidationError = require("../lib/bindings/http/validation/validation_error.js");
const {
  SPEC_V1
} = require("../lib/bindings/http/constants.js");

const id = uuidv4();
const type = "com.github.pull.create";
const source = "urn:event:from:myapi/resource/123";
const time = new Date();
const dataSchema = "http://example.com/registry/myschema.json";
const dataContentType = "application/json";
const data = {
  much: "wow"
};
const subject = "subject-x0";

const cloudevent = new CloudEvent({
  specversion: SPEC_V1,
  id,
  source,
  type,
  dataContentType,
  dataSchema,
  subject,
  time,
  data
});

describe("CloudEvents Spec v1.0", () => {
  describe("REQUIRED Attributes", () => {
    it("Should have 'id'", () => {
      expect(cloudevent.id).to.equal(id);
    });

    it("Should have 'source'", () => {
      expect(cloudevent.source).to.equal(source);
    });

    it("Should have 'specversion'", () => {
      expect(cloudevent.specversion).to.equal("1.0");
    });

    it("Should have 'type'", () => {
      expect(cloudevent.type).to.equal(type);
    });
  });

  describe("OPTIONAL Attributes", () => {
    it("Should have 'datacontenttype'", () => {
      expect(cloudevent.dataContentType).to.equal(dataContentType);
    });

    it("Should have 'dataschema'", () => {
      expect(cloudevent.dataSchema).to.equal(dataSchema);
    });

    it("Should have 'subject'", () => {
      expect(cloudevent.subject).to.equal(subject);
    });

    it("Should have 'time'", () => {
      expect(cloudevent.time).to.equal(time.toISOString());
    });
  });

  describe("Extensions Constraints", () => {
    it("should be ok when type is 'boolean'", () => {
      cloudevent.addExtension("ext-boolean", true);
      expect(cloudevent.spec.payload["ext-boolean"])
        .to.equal(true);
    });

    it("should be ok when type is 'integer'", () => {
      cloudevent.addExtension("ext-integer", 2019);
      expect(cloudevent.spec.payload["ext-integer"])
        .to.equal(2019);
    });

    it("should be ok when type is 'string'", () => {
      cloudevent.addExtension("ext-string", "an-string");
      expect(cloudevent.spec.payload["ext-string"])
        .to.equal("an-string");
    });

    it("should be ok when type is 'Uint32Array' for 'Binary'", () => {
      const myBinary = new Uint32Array(2019);
      cloudevent.addExtension("ext-binary", myBinary);
      expect(cloudevent.spec.payload["ext-binary"])
        .to.equal(myBinary);
    });

    // URI

    it("should be ok when type is 'Date' for 'Timestamp'", () => {
      const myDate = new Date();
      cloudevent.addExtension("ext-date", myDate);
      expect(cloudevent.spec.payload["ext-date"])
        .to.equal(myDate);
    });

    it("Should have the 'extension1'", () => {
      cloudevent.addExtension("extension1", "value1");
      expect(cloudevent.spec.payload.extension1)
        .to.equal("value1");
    });

    it("should throw an error when use a reserved name as extension", () => {
      expect(cloudevent.addExtension.bind(cloudevent, "id"))
        .to.throw(ValidationError, "Reserved attribute name: 'id'");
    });

    it("should throw an error when use an invalid type", () => {
      expect(cloudevent
        .addExtension.bind(cloudevent, "invalid-val", { cool: "nice" }))
        .to.throw(ValidationError, "Invalid type of extension value");
    });
  });

  describe("The Constraints check", () => {
    describe("'id'", () => {
      it("should throw an error when is absent", () => {
        delete cloudevent.spec.payload.id;
        expect(cloudevent.format.bind(cloudevent))
          .to
          .throw(ValidationError, "invalid payload");
        cloudevent.spec.payload.id = id;
      });

      it("should throw an error when is empty", () => {
        cloudevent.spec.payload.id = "";
        expect(cloudevent.format.bind(cloudevent))
          .to.throw(ValidationError, "invalid payload");
        cloudevent.spec.payload.id = id;
      });
    });

    describe("'source'", () => {
      it("should throw an error when is absent", () => {
        delete cloudevent.spec.payload.source;
        expect(cloudevent.format.bind(cloudevent))
          .to.throw(ValidationError, "invalid payload");
        cloudevent.spec.payload.source = source;
      });
    });

    describe("'specversion'", () => {
      it("should throw an error when is absent", () => {
        delete cloudevent.spec.payload.specversion;
        expect(cloudevent.format.bind(cloudevent))
          .to.throw(ValidationError, "invalid payload");
        cloudevent.spec.payload.specversion = "1.0";
      });

      it("should throw an error when is empty", () => {
        cloudevent.spec.payload.specversion = "";
        expect(cloudevent.format.bind(cloudevent))
          .to.throw(ValidationError, "invalid payload");
        cloudevent.spec.payload.specversion = "1.0";
      });
    });

    describe("'type'", () => {
      it("should throw an error when is absent", () => {
        delete cloudevent.spec.payload.type;
        expect(cloudevent.format.bind(cloudevent))
          .to.throw(ValidationError, "invalid payload");
        cloudevent.spec.payload.type = type;
      });

      it("should throw an error when is an empty string", () => {
        cloudevent.type = "";
        expect(cloudevent.format.bind(cloudevent))
          .to.throw(ValidationError, "invalid payload");
        cloudevent.type = type;
      });

      it("must be a non-empty string", () => {
        cloudevent.type = type;
        expect(cloudevent.spec.payload.type).to.equal(type);
      });
    });

    describe("'subject'", () => {
      it("should throw an error when is an empty string", () => {
        cloudevent.subject = "";
        expect(cloudevent.format.bind(cloudevent))
          .to.throw(ValidationError, "invalid payload");
        cloudevent.subject = type;
      });
    });

    describe("'time'", () => {
      it("must adhere to the format specified in RFC 3339", () => {
        cloudevent.time = time;
        expect(cloudevent.format().time).to.equal(time.toISOString());
      });
    });
  });

  describe("Event data constraints", () => {
    it("Should have 'data'", () => {
      expect(cloudevent.data).to.deep.equal(data);
    });

    it("should maintain the type of data when no data content type", () => {
      delete cloudevent.spec.payload.datacontenttype;
      cloudevent.data = JSON.stringify(data);

      expect(typeof cloudevent.data).to.equal("string");
      cloudevent.dataContentType = dataContentType;
    });

    it("should convert data with stringified json to a json object", () => {
      cloudevent.dataContentType = dataContentType;
      cloudevent.data = JSON.stringify(data);
      expect(cloudevent.data).to.deep.equal(data);
    });

    it("should be ok when type is 'Uint32Array' for 'Binary'", () => {
      const dataString = ")(*~^my data for ce#@#$%";

      const dataBinary = Uint32Array.from(dataString, (c) => c.codePointAt(0));
      const expected = asBase64(dataBinary);
      const olddct = cloudevent.dataContentType;

      cloudevent.dataContentType = "text/plain";
      cloudevent.data = dataBinary;
      expect(cloudevent.data).to.deep.equal(expected);

      cloudevent.dataContentType = olddct;
    });
  });
});
