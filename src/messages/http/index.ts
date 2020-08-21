import { CloudEvent, CloudEventV03, CloudEventV1, CONSTANTS, Version } from "../..";
import { Message, Sender, Headers } from "..";

import { headersFor, v1binaryParsers, validate } from "./headers";
import { asData, isBase64, isString, isStringOrObjectOrThrow, ValidationError } from "../../event/validation";
import { validateCloudEvent } from "../../event/spec";
import { MappedParser, parserByContentType } from "../../parsers";

// Sender is a function that takes headers and body for transmission
// over HTTP. Users supply this function as a parameter to HTTP.emit()
// Sends a message by invoking sender(). Implements Invoker
export function invoke(sender: Sender, message: Message): Promise<boolean> {
  return sender(message.headers, message.body);
}

// implements Serializer
export function binary(event: CloudEvent): Message {
  const contentType: Headers = { [CONSTANTS.HEADER_CONTENT_TYPE]: CONSTANTS.DEFAULT_CONTENT_TYPE };
  const headers: Headers = headersFor(event);
  return {
    headers: { ...contentType, ...headers },
    body: asData(event.data, event.datacontenttype as string),
  };
}

// implements Serializer
export function structured(event: CloudEvent): Message {
  return {
    headers: {
      [CONSTANTS.HEADER_CONTENT_TYPE]: CONSTANTS.DEFAULT_CE_CONTENT_TYPE,
    },
    body: event.toString(),
  };
}

/**
 * Parses an incoming HTTP Message, converting it to a {CloudEvent}
 * instance if it conforms to the Cloud Event specification for this receiver.
 *
 * @param {Message} message the incoming HTTP Message
 * @param {Version} version the spec version of the incoming event
 * @returns {CloudEvent} an instance of CloudEvent representing the incoming request
 * @throws {ValidationError} of the event does not conform to the spec
 */
export function receive(message: Message, version: Version = Version.V1): CloudEvent {
  const headers = message.headers;
  let body = message.body;

  if (!headers) throw new ValidationError("headers is null or undefined");
  if (body) {
    isStringOrObjectOrThrow(body, new ValidationError("payload must be an object or a string"));
  }

  if (
    headers[CONSTANTS.CE_HEADERS.SPEC_VERSION] &&
    headers[CONSTANTS.CE_HEADERS.SPEC_VERSION] !== Version.V03 &&
    headers[CONSTANTS.CE_HEADERS.SPEC_VERSION] !== Version.V1
  ) {
    throw new ValidationError(`invalid spec version ${headers[CONSTANTS.CE_HEADERS.SPEC_VERSION]}`);
  }

  body = isString(body) && isBase64(body) ? Buffer.from(body as string, "base64").toString() : body;

  // Clone and low case all headers names
  const sanitizedHeaders = validate(headers);

  const eventObj: { [key: string]: unknown | string | Record<string, unknown> } = {};
  const parserMap: Record<string, MappedParser> = version === Version.V1 ? v1binaryParsers : v1binaryParsers;

  for (const header in parserMap) {
    if (sanitizedHeaders[header]) {
      const mappedParser: MappedParser = parserMap[header];
      eventObj[mappedParser.name] = mappedParser.parser.parse(sanitizedHeaders[header]);
      delete sanitizedHeaders[header];
    }
  }

  let parsedPayload;

  if (body) {
    const parser = parserByContentType[eventObj.datacontenttype as string];
    if (!parser) {
      throw new ValidationError(`no parser found for content type ${eventObj.datacontenttype}`);
    }
    parsedPayload = parser.parse(body);
  }

  // Every unprocessed header can be an extension
  for (const header in sanitizedHeaders) {
    if (header.startsWith(CONSTANTS.EXTENSIONS_PREFIX)) {
      eventObj[header.substring(CONSTANTS.EXTENSIONS_PREFIX.length)] = headers[header];
    }
  }
  // At this point, if the datacontenttype is application/json and the datacontentencoding is base64
  // then the data has already been decoded as a string, then parsed as JSON. We don't need to have
  // the datacontentencoding property set - in fact, it's incorrect to do so.
  if (eventObj.datacontenttype === CONSTANTS.MIME_JSON && eventObj.datacontentencoding === CONSTANTS.ENCODING_BASE64) {
    delete eventObj.datacontentencoding;
  }

  const cloudevent = new CloudEvent({ ...eventObj, data: parsedPayload } as CloudEventV1 | CloudEventV03);
  validateCloudEvent(cloudevent);
  return cloudevent;
}
