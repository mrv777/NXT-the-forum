/******************************************************************************
 * Copyright © 2013-2016 The Nxt Core Developers.                             *
 *                                                                            *
 * See the AUTHORS.txt, DEVELOPER-AGREEMENT.txt and LICENSE.txt files at      *
 * the top-level directory of this distribution for the individual copyright  *
 * holder information and the developer policies on copyright and licensing.  *
 *                                                                            *
 * Unless otherwise agreed in a custom licensing agreement, no part of the    *
 * Nxt software, including this file, may be copied, modified, propagated,    *
 * or distributed except according to the terms contained in the LICENSE.txt  *
 * file.                                                                      *
 *                                                                            *
 * Removal or modification of this copyright notice is prohibited.            *
 *                                                                            *
 ******************************************************************************/

/**
 * @depends {nrs.js}
 */
var NRS = (function(NRS, $, undefined) {

	NRS.pages.p_the_forum = function() {
		var rows = "";
		
		NRS.sendRequest("getChannelTaggedData", {"channel": "The Forum"}, function(response) {
			if (response.data && response.data.length) {
				var categories = [];
				var topics = [];
				categories.push("<a href='#' class='btn btn-default btn-xs goto-page' data-category='All' data-page='p_the_forum'>All</a>")
				
				for (var i = 0; i < response.data.length; i++) {
					var topic = response.data[i];

					if (!topic) {
						continue;
					}
					var categoryInArray = false;
					
					topics.push(topic);
					$.each(topic.parsedTags, function( key, value ) {
						categories.push("<a href='#' class='btn btn-default btn-xs goto-page' data-category='"+value.escapeHTML()+"' data-page='p_the_forum'>"+value.escapeHTML()+"</a>")
						if (value==$('#category').html())
							categoryInArray = true;
					});
					
					if ($('#category').html() != "" && !categoryInArray && $('#category').html()!="All")
						continue;
						
					rows += "<tr>";
					rows += "<td><a href='#' class='goto-page' data-transaction='" + topic.transaction.escapeHTML() + "' data-page='p_the_forum_topic'>" + topic.name.escapeHTML() + "</a></td>";
					if ($('#category').html()=="All"){
						$("#columnCategories").show();
						
						rows += "<td>";
						$.each(topic.parsedTags, function( key, value ) {
							rows += value+",";
						});
						rows = rows.substring(0, rows.length-1);
						rows += "</td>";
					}
					else {
						$("#columnCategories").hide();
					}
					rows += "<td id='comments_"+topic.transaction.escapeHTML()+"'></td>";
					rows += "</tr>"; 
					
				}
			}
			$.each(topics, function( key, value ) {
				var comments = 0;
				NRS.sendRequest("getReferencingTransactions", {
						"transaction": value.transaction.escapeHTML()
					}, function(response) {	
					if (response.transactions && response.transactions.length) {
						for (var i = 0; i < response.transactions.length; i++) {
							var comment = response.transactions[i];

							if (!comment) {
								continue;
							}
							comments++;
						}
					}
					$('#comments_'+value.transaction.escapeHTML()).html(comments);
				});
			});
			NRS.dataLoaded(rows);
			uniqueCategories = jQuery.unique( categories );
			$('#categories').html(uniqueCategories.join(" "));
			$("button.goto-page, a.goto-page").click(function(event) {
				event.preventDefault();
				if ($(this).data("transaction")){
					$('#txID').html($(this).data("transaction"));
					$('#topicTitle').html($(this).text());
					NRS.goToPage($(this).data("page"), undefined, $(this).data("subpage"));
				}
				else if ($(this).data("category")){
					$('#category').html($(this).data("category"));
					NRS.loadPage($(this).data("page"), undefined, $(this).data("subpage"));
				}
				
			});
			$(".modal button.btn-primary:not([data-dismiss=modal]):not([data-ignore=true]),button.btn-calculate-fee").click(function() {
				NRS.submitForm($(this).closest(".modal"), $(this));
			});
			NRS.loadModalHTMLTemplates();
		});
	}
	
	NRS.pages.p_the_forum_topic = function() {
		var rows = "";
		NRS.sendRequest("getTransaction", {
				"transaction": $('#txID').html()
			}, function(response) {	
				if (response.attachment && response.attachment.data) {
					$('#topic').html(response.attachment.data);
					$('#referenceID').html(response.fullHash);
				}
		});
		
		NRS.sendRequest("getReferencingTransactions", {
				"transaction": $('#txID').html()
			}, function(response) {	
			if (response.transactions && response.transactions.length) {
				for (var i = 0; i < response.transactions.length; i++) {
					var comment = response.transactions[i];

					if (!comment) {
						continue;
					}
					if (comment.attachment && comment.attachment.message){ //Check if comment was provided as a message
						rows += "<tr>";
						rows += "<td>" + comment.attachment.message.escapeHTML() + "</td>";
						rows += "<td>" + comment.senderRS.escapeHTML() + "</td>";
						rows += "<td><a href='#' class='btn btn-default btn-xs' data-toggle='modal' data-target='#p_the_forum_new_comment_modal' data-fullhash='"+comment.fullHash+"'>Reply</a></td>";
						rows += "</tr>";
						rows += "<tr class='comment' id='"+comment.transaction+"'></div>"; 
					}
					else {
						rows += "<tr>";
						rows += "<td style='color:grey'>(Blank Comment)</td>";
						rows += "<td>" + comment.senderRS.escapeHTML() + "</td>";
						rows += "<td></td>";
						rows += "</tr>"; 
					}
				}
			}
			NRS.dataLoaded(rows);
			$( ".comment" ).each(function( index ) {
				var nestedComment = "";
				var txid=$(this).attr('id');
				NRS.sendRequest("getReferencingTransactions", {
					"transaction": txid
				}, function(response) {	
					if (response.transactions && response.transactions.length) {
						for (var i = 0; i < response.transactions.length; i++) {
							var comment = response.transactions[i];

							if (!comment) {
								continue;
							}
							nestedComment += "<tr>";
							if (comment.attachment && comment.attachment.message){ //Check if comment was provided as a message
								nestedComment += "<td style='padding-left:25px'>" + comment.attachment.message.escapeHTML() + "</td>";
								nestedComment += "<td>" + comment.senderRS.escapeHTML() + "</td>";
								nestedComment += "<td></td>";
							}
							else {
								nestedComment += "<td style='color:grey;padding-left:25px'>(Blank Comment)</td>";
								nestedComment += "<td>" + comment.senderRS.escapeHTML() + "</td>";
								nestedComment += "<td></td>";
							}
							nestedComment += "</tr>";
						}
						$('#'+txid).replaceWith(nestedComment);
					}
				});		
			});
			$("a.btn").click(function(event) {
				if ($(this).data("fullhash")){
					$('input[name="referencedTransactionFullHash"]').val($(this).data("fullhash"));
				}
				else{
					$('input[name="referencedTransactionFullHash"]').val($('#referenceID').text());
				}
				$('input[name="transaction"]').val($('#txID').text());
				
			});
		});
	}

	NRS.setup.p_the_forum = function() {
		//Do one-time initialization stuff here

	}

	return NRS;
}(NRS || {}, jQuery));

//File name for debugging (Chrome/Firefox)
//@ sourceURL=nrs.the_forum.js