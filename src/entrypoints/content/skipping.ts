import { TimeSection } from "@/src/typing/data";

export type Skippable = Pick<HTMLMediaElement, "currentTime" | "pause">;

type TimeRelation = "before" | "within" | "after" | "invalid";
/**
 * Where the time is in relation to the time section.
 * @param time The given time.
 * @param timeSection The section of time that the time is tested to
 * be in.
 * @returns
 */
function relationToTimeSection({
  time,
  timeSection,
}: {
  time: number;
  timeSection: TimeSection;
}): TimeRelation {
  if (timeSection.startTime > timeSection.endTime) {
    return "invalid";
  }

  // start is inclusive
  const afterStart = time >= timeSection.startTime;
  // end is exclusive
  const afterEnd = time >= timeSection.endTime;

  if (!afterStart) {
    return "before";
  }

  if (!afterEnd) {
    return "within";
  }

  return "after";
}

/**
 * What type of loop operation is taking place.
 * - "continue": do nothing as current time is valid.
 * - "skip": skip to next section.
 * - "loop": loop back to the beginning.
 * - "stop": stop playing.
 */
type SkipOperation = "continue" | "skip" | "loop" | "stop";
interface ValidTimeInfo {
  newTime: number;
  operation: SkipOperation;
}
/**
 * Given the current time and valid time sections, return the
 * currently valid time that the current time should be replaced by.
 * Assumes that `timeSections` is in order.
 */
function getValidTime({
  time,
  timeSections,
}: {
  time: number;
  timeSections: TimeSection[];
}): ValidTimeInfo {
  let relation: TimeRelation;

  let allDisabled = true;
  for (const timeSection of timeSections) {
    if (timeSection.disabled) continue;

    allDisabled = false;

    relation = relationToTimeSection({ time, timeSection });
    if (relation === "before") {
      return {
        newTime: timeSection.startTime,
        operation: "skip",
      };
    }
    if (relation === "within") {
      return {
        newTime: time,
        operation: "continue",
      };
    }
  }

  if (allDisabled) {
    return {
      newTime: time,
      operation: "stop",
    };
  }

  // if the time is after all the timeSections, loop back to the first
  // timeSection.
  return {
    newTime: timeSections[0].startTime,
    operation: "loop",
  };
}

/**
 * Make the skippable play through the specified sections.
 * @param shouldLoop Whether to loop when going beyond the last section.
 * Defaults to false.
 */
export function playSections({
  skippable,
  timeSections,
  shouldLoop,
}: {
  skippable: Skippable;
  timeSections: TimeSection[];
  shouldLoop?: boolean;
}) {
  const { newTime, operation } = getValidTime({
    time: skippable.currentTime,
    timeSections,
  });

  if (operation === "continue") {
    return;
  }

  if ((operation === "loop" && !shouldLoop) || operation === "stop") {
    skippable.pause();
  }

  skippable.currentTime = newTime;
}
