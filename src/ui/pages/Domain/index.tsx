import React, {ReactElement, useCallback, useEffect, useMemo, useState} from "react";
import Icon from "@src/ui/components/Icon";
import {useHistory, useParams} from "react-router";
import "./domain-page.scss";
import {fetchDomainName, useDomainByName} from "@src/ui/ducks/domains";
import Name from "@src/ui/components/Name";
import {heightToMoment} from "@src/util/number";
import {useDispatch} from "react-redux";
import {
  FinalizeButton,
  RedeemButton,
  RegisterButton,
} from "@src/ui/components/HomeActionButton";
import MessageTypes from "@src/util/messageTypes";
import postMessage from "@src/util/postMessage";
import Button, {ButtonType} from "@src/ui/components/Button";
import Select from "@src/ui/components/Select";
import Input from "@src/ui/components/Input";
import {toASCII} from "@src/util/name";
const Network = require("hsd/lib/protocol/network");
const networkType = process.env.NETWORK_TYPE || "main";

type RecordType = "DS" | "NS" | "GLUE4" | "GLUE6" | "SYNTH4" | "SYNTH6" | "TXT";
type EditableRecord = {
  type: RecordType;
  keyTag?: number | string;
  algorithm?: number | string;
  digestType?: number | string;
  digest?: string;
  ns?: string;
  address?: string;
  txt?: string[] | string;
};

const RECORD_TYPES: RecordType[] = ["DS", "NS", "GLUE4", "GLUE6", "SYNTH4", "SYNTH6", "TXT"];

const RECORD_FIELDS: Record<RecordType, {key: keyof EditableRecord; label: string; type?: string; placeholder?: string}[]> = {
  DS: [
    {key: "keyTag", label: "Key Tag", type: "number"},
    {key: "algorithm", label: "Algorithm", type: "number"},
    {key: "digestType", label: "Digest Type", type: "number"},
    {key: "digest", label: "Digest"},
  ],
  NS: [
    {key: "ns", label: "Nameserver", placeholder: "ns1.example."},
  ],
  GLUE4: [
    {key: "ns", label: "Nameserver", placeholder: "ns1.example."},
    {key: "address", label: "IPv4 Address", placeholder: "192.0.2.1"},
  ],
  GLUE6: [
    {key: "ns", label: "Nameserver", placeholder: "ns1.example."},
    {key: "address", label: "IPv6 Address", placeholder: "2001:db8::1"},
  ],
  SYNTH4: [
    {key: "address", label: "IPv4 Address", placeholder: "192.0.2.1"},
  ],
  SYNTH6: [
    {key: "address", label: "IPv6 Address", placeholder: "2001:db8::1"},
  ],
  TXT: [
    {key: "txt", label: "TXT Values", placeholder: "comma-separated values"},
  ],
};

function createEmptyRecord(type: RecordType): EditableRecord {
  switch (type) {
    case "DS":
      return {type, keyTag: "", algorithm: "", digestType: "", digest: ""};
    case "NS":
      return {type, ns: ""};
    case "GLUE4":
    case "GLUE6":
      return {type, ns: "", address: ""};
    case "SYNTH4":
    case "SYNTH6":
      return {type, address: ""};
    case "TXT":
      return {type, txt: ""};
  }
}

function fieldValue(record: EditableRecord, key: keyof EditableRecord): string {
  const value = record[key];
  if (Array.isArray(value)) return value.join(", ");
  if (value === undefined || value === null) return "";
  return String(value);
}

function normalizeRecord(record: EditableRecord): EditableRecord {
  switch (record.type) {
    case "DS":
      return {
        type: record.type,
        keyTag: Number(record.keyTag),
        algorithm: Number(record.algorithm),
        digestType: Number(record.digestType),
        digest: String(record.digest || "").trim(),
      };
    case "TXT":
      return {
        type: record.type,
        txt: fieldValue(record, "txt")
          .split(",")
          .map((txt) => txt.trim())
          .filter(Boolean),
      };
    case "NS":
      return {type: record.type, ns: String(record.ns || "").trim()};
    case "GLUE4":
    case "GLUE6":
      return {
        type: record.type,
        ns: String(record.ns || "").trim(),
        address: String(record.address || "").trim(),
      };
    case "SYNTH4":
    case "SYNTH6":
      return {type: record.type, address: String(record.address || "").trim()};
  }
}

function validateRecords(records: EditableRecord[]): string | null {
  for (const record of records) {
    const fields = RECORD_FIELDS[record.type];

    for (const field of fields) {
      const value = fieldValue(record, field.key).trim();
      if (!value) return `${field.label} is required for ${record.type} records.`;
    }

    if (record.type === "DS") {
      for (const key of ["keyTag", "algorithm", "digestType"] as (keyof EditableRecord)[]) {
        if (Number.isNaN(Number(record[key]))) {
          return `${RECORD_FIELDS.DS.find((field) => field.key === key)?.label} must be a number.`;
        }
      }
    }
  }

  return null;
}

export default function DomainPage(): ReactElement {
  const {name} = useParams<{name: string}>();
  const history = useHistory();
  const domain = useDomainByName(name);
  const dispatch = useDispatch();
  const network = Network.get(networkType);
  const [records, setRecords] = useState<EditableRecord[]>([]);
  const [editableRecords, setEditableRecords] = useState<EditableRecord[]>([]);
  const [isEditingRecords, setIsEditingRecords] = useState(false);
  const [recordError, setRecordError] = useState("");
  const [recordNotice, setRecordNotice] = useState("");
  const [submittingRecords, setSubmittingRecords] = useState(false);

  useEffect(() => {
    dispatch(fetchDomainName(name));
    (async function onDomainPageMount() {
      const payload = await postMessage({
        type: MessageTypes.GET_NAME_RESOURCE,
        payload: name,
      });
      const {result} = payload || {};
      const {records} = result || {};
      setRecords(records || []);
      setEditableRecords(records || []);
    })();
  }, [name]);

  useEffect(() => {
    if (!domain) return;
  }, [domain]);

  const hasRecordChanges = useMemo(
    () => JSON.stringify(records) !== JSON.stringify(editableRecords),
    [records, editableRecords]
  );

  const updateEditableRecord = useCallback(
    (recordIndex: number, key: keyof EditableRecord, value: string) => {
      setRecordError("");
      setRecordNotice("");
      setEditableRecords((currentRecords) =>
        currentRecords.map((record, index) => {
          if (index !== recordIndex) return record;
          return {...record, [key]: value};
        })
      );
    },
    []
  );

  const updateRecordType = useCallback((recordIndex: number, type: RecordType) => {
    setRecordError("");
    setRecordNotice("");
    setEditableRecords((currentRecords) =>
      currentRecords.map((record, index) => index === recordIndex ? createEmptyRecord(type) : record)
    );
  }, []);

  const addRecord = useCallback(() => {
    setIsEditingRecords(true);
    setRecordError("");
    setRecordNotice("");
    setEditableRecords((currentRecords) => [...currentRecords, createEmptyRecord("NS")]);
  }, []);

  const removeRecord = useCallback((recordIndex: number) => {
    setRecordError("");
    setRecordNotice("");
    setEditableRecords((currentRecords) => currentRecords.filter((_, index) => index !== recordIndex));
  }, []);

  const cancelRecordEdit = useCallback(() => {
    setEditableRecords(records);
    setIsEditingRecords(false);
    setRecordError("");
    setRecordNotice("");
  }, [records]);

  const submitRecords = useCallback(async () => {
    setRecordError("");
    setRecordNotice("");

    const error = validateRecords(editableRecords);
    if (error) {
      setRecordError(error);
      return;
    }

    if (!editableRecords.length && !window.confirm("Submit an empty DNS resource for this domain?")) {
      return;
    }

    setSubmittingRecords(true);
    try {
      const normalizedRecords = editableRecords.map(normalizeRecord);
      const tx = await postMessage({
        type: MessageTypes.CREATE_UPDATE,
        payload: {
          name: toASCII(name),
          data: {records: normalizedRecords},
        },
      });

      if (tx) {
        await postMessage({
          type: MessageTypes.ADD_TX_QUEUE,
          payload: tx,
        });

        setEditableRecords(records);
        setIsEditingRecords(false);
        setRecordNotice("Update transaction added to the queue.");
      }
    } catch (e) {
      setRecordError(e.message || "Could not create the update transaction.");
    } finally {
      setSubmittingRecords(false);
    }
  }, [editableRecords, name, records]);

  if (!domain) {
    return <></>;
  }

  const expiry = heightToMoment(
    domain.renewal + network.names.renewalWindow
  ).format("YYYY-MM-DD");

  return (
    <div className="domain-page">
      <div className="domain-page__header">
        <div className="domain-page__header__action">
          <Icon
            fontAwesome="fa-arrow-left"
            size={1.25}
            onClick={() => history.push(`/?defaultTab=domains`)}
          />
          <span onClick={() => () => history.push(`/?defaultTab=domains`)}>
            Back
          </span>
        </div>
        <div className="domain-page__header__content">
          <div className="domain-page__header__content__name">
            <Name name={name} slash />
          </div>
          <div className="domain-page__header__content__expiry">
            {`Expires on ${expiry}`}
          </div>
          <div className="domain-page__header__content__buttons">
            {!domain?.ownerCovenantType && <RedeemButton name={name} />}
            {domain?.ownerCovenantType === "REVEAL" && (
              <RegisterButton name={name} />
            )}
            {domain?.ownerCovenantType === "TRANSFER" && (
              <FinalizeButton name={name} />
            )}
          </div>
        </div>
      </div>
      <div className="domain-page__content">
        <div className="domain-page__records-group">
          <div className="domain-page__records-group__header">
            <div className="domain-page__records-group__header__label">
              Root Zone DNS
            </div>
            <div className="domain-page__records-group__header__actions">
              <Button
                tiny
                btnType={ButtonType.secondary}
                onClick={() => {
                  setIsEditingRecords(true);
                  setRecordError("");
                  setRecordNotice("");
                }}
                disabled={isEditingRecords}
              >
                Edit
              </Button>
              <Button tiny onClick={addRecord}>Add Record</Button>
            </div>
          </div>
          {!!recordError && (
            <div className="domain-page__records-group__message domain-page__records-group__message--error">
              {recordError}
            </div>
          )}
          {!!recordNotice && (
            <div className="domain-page__records-group__message">
              {recordNotice}
            </div>
          )}
          {isEditingRecords && (
            <div className="domain-page__records-group__message">
              Add or remove as many records as needed, then submit them together in one update transaction.
            </div>
          )}
          {!editableRecords.length && (
            <div className="domain-page__record">
              <div className="domain-page__record__empty">No Records Found</div>
            </div>
          )}
          {editableRecords.map((record: EditableRecord, recordIndex) => {
            const {type} = record;
            return (
              <div className="domain-page__record" key={`${type}-${recordIndex}`}>
                <div className="domain-page__record__header">
                  {!isEditingRecords && (
                    <div className="domain-page__record__type">{type} Record</div>
                  )}
                  {isEditingRecords && (
                    <Select
                      className="domain-page__record__type-select"
                      label="Type"
                      value={type}
                      onChange={(event) => updateRecordType(recordIndex, event.target.value as RecordType)}
                      options={RECORD_TYPES.map((recordType) => ({
                        value: recordType,
                        children: recordType,
                      }))}
                    />
                  )}
                  {isEditingRecords && (
                    <Button
                      tiny
                      btnType={ButtonType.secondary}
                      onClick={() => removeRecord(recordIndex)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                {!isEditingRecords && (
                  <div className="domain-page__record__kvs">
                    {Object.keys(record).map(
                      (key) =>
                        key !== "type" && (
                          <div className="domain-page__record__kv" key={key}>
                            <div className="domain-page__record__key">{key}</div>
                            <div className="domain-page__record__value">
                              {fieldValue(record, key as keyof EditableRecord)}
                            </div>
                          </div>
                        )
                    )}
                  </div>
                )}
                {isEditingRecords && (
                  <div className="domain-page__record__fields">
                    {RECORD_FIELDS[type].map((field) => (
                      <Input
                        key={String(field.key)}
                        label={field.label}
                        type={field.type || "text"}
                        placeholder={field.placeholder}
                        value={fieldValue(record, field.key)}
                        onChange={(event) =>
                          updateEditableRecord(recordIndex, field.key, event.target.value)
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {isEditingRecords && (
            <div className="domain-page__records-group__footer">
              <Button
                btnType={ButtonType.secondary}
                onClick={cancelRecordEdit}
                disabled={submittingRecords}
              >
                Cancel
              </Button>
              <Button
                onClick={submitRecords}
                disabled={submittingRecords || !hasRecordChanges}
                loading={submittingRecords}
              >
                Submit All Changes
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
