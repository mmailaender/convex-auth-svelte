import { Popover as PopoverPrimitive } from '@ark-ui/svelte/popover';
import Content from './popover-content.svelte';
import Trigger from './popover-trigger.svelte';

const Root = PopoverPrimitive.Root;
const Title = PopoverPrimitive.Title;
const Description = PopoverPrimitive.Description;
const Close = PopoverPrimitive.CloseTrigger;
const Positioner = PopoverPrimitive.Positioner;

export {
	Root,
	Trigger,
	Positioner,
	Content,
	Title,
	Description,
	Close,
	//
	Root as Popover,
	Positioner as PopoverPositioner,
	Content as PopoverContent,
	Trigger as PopoverTrigger,
	Close as PopoverClose
};
