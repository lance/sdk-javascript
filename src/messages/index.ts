import { CloudEvent, Version } from "..";
import { binary, invoke, receive, structured } from "./http";

/**
 * Binding is an interface for transport protocols to implement,
 * which provides functions for sending CloudEvent Messages over
 * the wire.
 */
export interface Binding {
  binary: Serializer;
  structured: Serializer;
  send: Invoker;
  receive: Receiver;
}

/**
 * Headers is an interface representing transport-agnostic headers as
 * key/value string pairs
 */
export interface Headers {
  [key: string]: string;
}

/**
 * Message is an interface representing a CloudEvent as a
 * transport-agnostic message
 */
export interface Message {
  headers: Headers;
  body: string;
}

/**
 * Serializer is an interface for functions that can convert a
 * CloudEvent into a Message.
 */
export interface Serializer {
  (event: CloudEvent): Message;
}

/**
 * Sender is a function interface for user-supplied functions
 * capable of transmitting a Message over a specific protocol
 */
export interface Sender {
  (headers: Headers, body: string): Promise<boolean>;
}

/**
 * Invoker is an interface for functions that send a message
 * over a specific protocol by invoking the user-supplied
 * Sender function with the message headers and body.
 * TODO: This might be overkill
 */
export interface Invoker {
  (sender: Sender, message: Message): Promise<boolean>;
}

/**
 * Receiver is a function interface that converts an incoming
 * Message to a CloudEvent
 */
export interface Receiver {
  (message: Message, version: Version | undefined): CloudEvent;
}

// Export HTTP transport capabilities
export const HTTP: Binding = {
  binary: binary as Serializer,
  structured: structured as Serializer,
  send: invoke as Invoker,
  receive: receive as Receiver,
};
