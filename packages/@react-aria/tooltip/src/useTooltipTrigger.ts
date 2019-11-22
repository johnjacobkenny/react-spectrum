import {AllHTMLAttributes, RefObject} from 'react';
import {chain} from '@react-aria/utils';
import {DOMProps} from '@react-types/shared';
import {useId} from '@react-aria/utils';
import {useOverlay} from '@react-aria/overlays';

interface TooltipProps extends DOMProps {
  onClose?: () => void,
  role?: 'tooltip'
}

interface TriggerProps extends DOMProps, AllHTMLAttributes<HTMLElement> {
  ref: RefObject<HTMLElement | null>,
}

interface TooltipTriggerState {
  open: boolean,                    // before was isOpen
  setOpen(value: boolean): void
}

interface TooltipTriggerProps {
  tooltipProps: TooltipProps,
  triggerProps: TriggerProps,
  state: TooltipTriggerState
}

interface TooltipTriggerAria {
  tooltipTriggerProps: AllHTMLAttributes<HTMLElement>,
  tooltipProps: AllHTMLAttributes<HTMLElement>
}

export function useTooltipTrigger(props: TooltipTriggerProps): TooltipTriggerAria {
  let {
    tooltipProps,
    triggerProps,
    state
  } = props;

  let tooltipTriggerId = useId();

  let {overlayProps} = useOverlay({
    ref: triggerProps.ref,
    onClose: tooltipProps.onClose,
    isOpen: state.open                       // before was state.isOpen
  });

  let onKeyDownTrigger = (e) => {

    console.log("in key down trigger")

    if (triggerProps.ref && triggerProps.ref.current) {

      // dismiss tooltip on esc key press
      if (e.key === 'Escape') {
        console.log("esc button called from tooltip")
        e.preventDefault();
        //e.stopPropagation();
        state.setOpen(false);
      }

    }

  };

  return {
    tooltipTriggerProps: {
      ...overlayProps,
      ref: triggerProps.ref, // this line is necessary for functionality and removing it doesn't get rid of the ref warning
      id: tooltipTriggerId,
      role: 'button',
      onKeyDown: chain(triggerProps.onKeyDown, onKeyDownTrigger)
    },
    tooltipProps: {
      'aria-describedby': tooltipProps['aria-describedby'] || tooltipTriggerId,
      role: tooltipProps.role || 'tooltip'
    }
  };
}
