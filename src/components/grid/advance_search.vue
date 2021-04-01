<template>
    <div class="grid-advance-search-con">
        <Button @click="toggleModal" type="default">{{getAdvanceSearchTitle()}}</Button>
        <Modal :width="modalWidth"
                v-model="searchModal"
                :title="getAdvanceSearchTitle()"  :ok-text="t('m.grid.search')" :cancel-text="t('m.grid.reset')"
                @on-ok="doSearch"
                @on-cancel="doReset">
            <adv-form ref="advFormRef"
                :query-options="queryOptions"
                :quicksearch-keyword="quicksearchKeyword"
                :quicksearch="quicksearch"
                :init-model="initModel"
                :entity-name="entityName"
                :advance-search-fields="advanceSearchFields"
                :connect-keyword="connectKeyword"
                @on-advance-search="handleOnAdvanceSearch">
            </adv-form>
        </Modal>
    </div>
</template>
<script>
import baseProps from './adv-search/base-props';
import context from '../../libs/context';
import locale from '../mixins/locale';
export default {
    mixins:[baseProps,locale],
    props: {
        toolbarType: {//'compact':紧凑型toolbar布局；不设置用默认toolbar布局
            type: String,
            required: false
        },
        modalWidth:{
            type:Number,
            default:60
        },
        modalHeight:{
            type:Number,
            default(){
                if(!document.documentElement){
                    return 400;
                }
                let clientHeight=document.documentElement.clientHeight-220;
                return clientHeight>0?clientHeight:400;
            }
        }
    },
    data:function(){
        return {
            searchModal:false
        };
    },
    methods:{
        doReset(){
            this.$refs.advFormRef.doReset();
        },
        doSearch(){
            this.$refs.advFormRef.doSearch();
        },
        toggleModal(){
            this.searchModal=!this.searchModal;
        },
        handleOnAdvanceSearch(advanceSearchFilters,innerQuicksearchKeyword,joins){
            this.$emit("on-advance-search",advanceSearchFilters,innerQuicksearchKeyword,joins);
            this.searchModal=false;
        },
        getAdvanceSearchTitle(){
            return this.t('m.grid.advanceSearch');
        }
    },
    components:{
        advForm:require('./adv-search/form').default
    }
}
</script>

